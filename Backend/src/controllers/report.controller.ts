import { Request, Response } from 'express'
import prisma from '../utils/prisma'

function getBoliviaDayRange() {
  const now = new Date()
  const boliviaOffset = -4 * 60
  const localOffset = now.getTimezoneOffset()
  const totalOffset = boliviaOffset - localOffset
  const boliviaNow = new Date(now.getTime() + totalOffset * 60 * 1000)
  const boliviaStart = new Date(boliviaNow)
  boliviaStart.setHours(0, 0, 0, 0)
  const boliviaEnd = new Date(boliviaStart)
  boliviaEnd.setDate(boliviaEnd.getDate() + 1)
  const utcStart = new Date(boliviaStart.getTime() - totalOffset * 60 * 1000)
  const utcEnd = new Date(boliviaEnd.getTime() - totalOffset * 60 * 1000)
  return { start: utcStart, end: utcEnd, boliviaDate: boliviaStart }
}

export async function getDailySales(req: Request, res: Response) {
  try {
    const { start, end, boliviaDate } = getBoliviaDayRange()

    const orders = await prisma.order.findMany({
      where: {
        status: 'PAGADO',
        createdAt: { gte: start, lt: end }
      }
    })

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
    const totalOrders = orders.length
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    return res.json({
      date: boliviaDate.toISOString(),
      totalSales,
      totalOrders,
      avgTicket
    })
  } catch (error) {
    console.error('Daily sales error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getTopDishes(req: Request, res: Response) {
  try {
    const { type } = req.query
    const { start, end } = getBoliviaDayRange()

    const orders = await prisma.order.findMany({
      where: {
        status: 'PAGADO',
        createdAt: { gte: start, lt: end }
      },
      include: {
        items: {
          where: { type: 'dish' },
          include: { dish: { include: { category: true } } }
        }
      }
    })

    const dishCount: Record<string, { dish: any; totalQty: number }> = {}
    for (const order of orders) {
      for (const item of order.items) {
        if (item.dish) {
          if (type && item.dish.category?.type !== type) continue
          const key = item.dish.name
          if (dishCount[key]) {
            dishCount[key].totalQty += Number(item.quantity)
          } else {
            dishCount[key] = { dish: item.dish, totalQty: Number(item.quantity) }
          }
        }
      }
    }

    const top = Object.values(dishCount)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10)

    return res.json(top)
  } catch (error) {
    console.error('Top dishes error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function closeTurno(req: Request, res: Response) {
  try {
    const { start, end } = getBoliviaDayRange()

    const existing = await prisma.turnoClosure.findFirst({
      where: { openedAt: start }
    })
    if (existing) {
      return res.status(400).json({ message: 'El turno de hoy ya fue cerrado' })
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'PAGADO',
        createdAt: { gte: start, lt: end }
      }
    })

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0)
    const totalOrders = orders.length

    const closure = await prisma.turnoClosure.create({
      data: {
        userId: req.user!.userId,
        openedAt: start,
        closedAt: new Date(),
        totalSales,
        totalOrders
      }
    })

    let closedCaja = null
    const openCaja = await prisma.cajaSession.findFirst({ where: { status: 'ABIERTA' } })
    if (openCaja) {
      closedCaja = await prisma.cajaSession.update({
        where: { id: openCaja.id },
        data: { closingAmount: totalSales, closedAt: new Date(), status: 'CERRADA' },
        include: { user: { select: { id: true, name: true, username: true } } }
      })
      const { emitCajaClosed } = await import('../socket/emitter')
      emitCajaClosed(closedCaja)
    }

    return res.status(201).json({ closure, closedCaja })
  } catch (error) {
    console.error('Close turno error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
