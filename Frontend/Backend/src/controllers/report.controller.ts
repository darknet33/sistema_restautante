import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { OrderStatus, MovementType } from '@prisma/client'

export async function getDailySales(req: Request, res: Response) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const orders = await prisma.order.findMany({
      where: {
        status: 'PAGADO',
        updatedAt: { gte: today, lt: tomorrow }
      }
    })

    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = orders.length
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    return res.json({
      date: today.toISOString().split('T')[0],
      totalSales,
      totalOrders,
      avgTicket
    })
  } catch (error) {
    console.error('Daily sales error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getTopDishes(req: Request, res: Response) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const topDishes = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: 'PAGADO',
          updatedAt: { gte: today, lt: tomorrow }
        }
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    })

    const result = await Promise.all(
      topDishes.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        return {
          product: product?.name,
          category: product?.categoryId,
          quantitySold: item._sum.quantity,
          revenue: Number(product?.price || 0) * Number(item._sum.quantity || 0)
        }
      })
    )

    return res.json(result)
  } catch (error) {
    console.error('Top dishes error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function closeTurno(req: Request, res: Response) {
  try {
    const userId = req.user!.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'PAGADO',
        updatedAt: { gte: today, lt: tomorrow }
      }
    })

    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = orders.length

    const turno = await prisma.turnoClosure.create({
      data: {
        userId,
        closedAt: new Date(),
        totalSales,
        totalOrders
      }
    })

    return res.json(turno)
  } catch (error) {
    console.error('Close turno error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
