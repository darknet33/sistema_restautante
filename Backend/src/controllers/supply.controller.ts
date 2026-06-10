import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getAll(req: Request, res: Response) {
  try {
    const { category, tracked } = req.query
    const where: any = {}
    if (category) where.categoryId = Number(category)
    if (tracked === 'true') where.isInventoryTracked = true

    const supplies = await prisma.supply.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' }
    })
    return res.json(supplies)
  } catch (error) {
    console.error('Get supplies error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const supply = await prisma.supply.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true }
    })
    if (!supply) return res.status(404).json({ message: 'Consumible no encontrado' })
    return res.json(supply)
  } catch (error) {
    console.error('Get supply error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getLowStock(req: Request, res: Response) {
  try {
    const supplies = await prisma.supply.findMany({
      where: {
        isInventoryTracked: true,
        stockCurrent: { lte: prisma.supply.fields.stockMin }
      },
      include: { category: true },
      orderBy: { name: 'asc' }
    })
    return res.json(supplies)
  } catch (error) {
    console.error('Get low stock error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, unit, purchaseCost, salePrice, stockCurrent, stockMin, categoryId, isInventoryTracked } = req.body

    const supply = await prisma.supply.create({
      data: {
        name,
        unit: unit || 'unidad',
        purchaseCost: Number(purchaseCost) || 0,
        salePrice: Number(salePrice) || 0,
        stockCurrent: Number(stockCurrent) || 0,
        stockMin: Number(stockMin) || 0,
        categoryId: Number(categoryId),
        isInventoryTracked: isInventoryTracked === 'true' || isInventoryTracked === true
      },
      include: { category: true }
    })
    return res.status(201).json(supply)
  } catch (error) {
    console.error('Create supply error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, unit, purchaseCost, salePrice, stockCurrent, stockMin, categoryId, isInventoryTracked } = req.body
    const data: any = {}
    if (name) data.name = name
    if (unit) data.unit = unit
    if (purchaseCost !== undefined) data.purchaseCost = Number(purchaseCost)
    if (salePrice !== undefined) data.salePrice = Number(salePrice)
    if (stockCurrent !== undefined) data.stockCurrent = Number(stockCurrent)
    if (stockMin !== undefined) data.stockMin = Number(stockMin)
    if (categoryId) data.categoryId = Number(categoryId)
    if (isInventoryTracked !== undefined) data.isInventoryTracked = isInventoryTracked === 'true' || isInventoryTracked === true

    const supply = await prisma.supply.update({
      where: { id: Number(id) },
      data,
      include: { category: true }
    })
    return res.json(supply)
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Consumible no encontrado' })
    console.error('Update supply error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const supply = await prisma.supply.findUnique({ where: { id } })
    if (!supply) return res.status(404).json({ message: 'Consumible no encontrado' })

    const orderCount = await prisma.orderItem.count({
      where: { supplyId: id, type: 'supply' }
    })
    const wasteCount = await prisma.waste.count({ where: { supplyId: id } })
    const movementCount = await prisma.inventoryMovement.count({ where: { supplyId: id } })
    if (orderCount > 0 || wasteCount > 0 || movementCount > 0) {
      const parts: string[] = []
      if (orderCount > 0) parts.push(`${orderCount} pedido(s)`)
      if (wasteCount > 0) parts.push(`${wasteCount} merma(s)`)
      if (movementCount > 0) parts.push(`${movementCount} movimiento(s) de inventario`)
      return res.status(409).json({
        message: `No se puede eliminar: tiene ${parts.join(', ')} asociados`
      })
    }

    await prisma.supply.delete({ where: { id } })
    return res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Consumible no encontrado' })
    console.error('Delete supply error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function addStock(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { quantity } = req.body
    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida' })
    }

    const supply = await prisma.supply.findUnique({ where: { id: Number(id) } })
    if (!supply) return res.status(404).json({ message: 'Consumible no encontrado' })

    const updated = await prisma.supply.update({
      where: { id: Number(id) },
      data: { stockCurrent: { increment: Number(quantity) } },
      include: { category: true }
    })

    await prisma.inventoryMovement.create({
      data: {
        supplyId: Number(id),
        type: 'ENTRADA',
        quantity: Number(quantity),
        stockBefore: supply.stockCurrent,
        stockAfter: updated.stockCurrent,
        userId: req.user!.userId
      }
    })

    return res.json(updated)
  } catch (error) {
    console.error('Add stock error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
