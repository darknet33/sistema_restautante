import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getAll(req: Request, res: Response) {
  try {
    const { startDate, endDate, supplyId } = req.query
    const where: any = {}
    if (supplyId) where.supplyId = Number(supplyId)
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const wastes = await prisma.waste.findMany({
      where,
      include: { supply: { include: { category: true } }, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(wastes)
  } catch (error) {
    console.error('Get wastes error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { supplyId, quantity, reason } = req.body
    if (!supplyId || !quantity || !reason) {
      return res.status(400).json({ message: 'supplyId, quantity y reason son requeridos' })
    }

    const supply = await prisma.supply.findUnique({ where: { id: Number(supplyId) } })
    if (!supply) return res.status(404).json({ message: 'Consumible no encontrado' })

    const qty = Number(quantity)
    if (qty <= 0) return res.status(400).json({ message: 'La cantidad debe ser positiva' })

    const waste = await prisma.$transaction(async (tx) => {
      const updated = await tx.supply.update({
        where: { id: Number(supplyId) },
        data: { stockCurrent: { decrement: qty } }
      })

      await tx.inventoryMovement.create({
        data: {
          supplyId: Number(supplyId),
          type: 'MERMA',
          quantity: qty,
          stockBefore: supply.stockCurrent,
          stockAfter: updated.stockCurrent,
          userId: req.user!.userId
        }
      })

      return tx.waste.create({
        data: {
          supplyId: Number(supplyId),
          quantity: qty,
          reason,
          userId: req.user!.userId
        },
        include: { supply: { include: { category: true } } }
      })
    })

    return res.status(201).json(waste)
  } catch (error) {
    console.error('Create waste error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
