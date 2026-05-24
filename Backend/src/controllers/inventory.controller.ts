import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { MovementType } from '@prisma/client'

export async function getMovements(req: Request, res: Response) {
  try {
    const { productId, type, startDate, endDate } = req.query
    const where: any = {}
    if (productId) where.productId = Number(productId)
    if (type) where.type = type
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: { product: true, user: true },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(movements)
  } catch (error) {
    console.error('Get movements error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function createMovement(req: Request, res: Response) {
  try {
    const { productId, type, quantity, notes } = req.body
    const userId = req.user!.userId

    if (!productId || !type || !quantity) {
      return res.status(400).json({ message: 'productId, type and quantity required' })
    }

    const validTypes = ['ENTRADA', 'MERMA', 'AJUSTE']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid movement type' })
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } })
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const stockBefore = Number(product.stockCurrent)
    let stockAfter = stockBefore

    if (type === 'ENTRADA') stockAfter = stockBefore + Number(quantity)
    else if (type === 'MERMA' || type === 'AJUSTE') stockAfter = stockBefore - Number(quantity)

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { stockCurrent: stockAfter }
      })

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          type: type as MovementType,
          quantity: Number(quantity),
          stockBefore,
          stockAfter,
          userId
        }
      })
    })

    return res.status(201).json({ message: 'Movement created successfully' })
  } catch (error) {
    console.error('Create movement error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
