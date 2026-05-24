import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getProducts(req: Request, res: Response) {
  try {
    const { category, available, type } = req.query
    const where: any = {}
    if (category) where.categoryId = Number(category)
    if (available !== undefined) where.isAvailable = available === 'true'
    if (type) {
      where.category = {
        type: type as string
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' }
    })
    return res.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    return res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const {
      name, categoryId, price, cost, unit,
      stockCurrent, stockMin, isInventoryTracked, isAvailable
    } = req.body

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ message: 'Name, categoryId and price required' })
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId: Number(categoryId),
        price: Number(price),
        cost: cost ? Number(cost) : 0,
        unit: unit || 'unidad',
        stockCurrent: stockCurrent ? Number(stockCurrent) : 0,
        stockMin: stockMin ? Number(stockMin) : 0,
        isInventoryTracked: isInventoryTracked || false,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      include: { category: true }
    })
    return res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const {
      name, categoryId, price, cost, unit,
      stockCurrent, stockMin, isInventoryTracked, isAvailable
    } = req.body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (categoryId !== undefined) data.categoryId = Number(categoryId)
    if (price !== undefined) data.price = Number(price)
    if (cost !== undefined) data.cost = Number(cost)
    if (unit !== undefined) data.unit = unit
    if (stockCurrent !== undefined) data.stockCurrent = Number(stockCurrent)
    if (stockMin !== undefined) data.stockMin = Number(stockMin)
    if (isInventoryTracked !== undefined) data.isInventoryTracked = isInventoryTracked
    if (isAvailable !== undefined) data.isAvailable = isAvailable

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true }
    })
    return res.json(product)
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Product not found' })
    console.error('Update product error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    await prisma.product.delete({ where: { id } })
    return res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Product not found' })
    console.error('Delete product error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getLowStock(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      where: {
        isInventoryTracked: true,
        stockCurrent: { lte: prisma.product.fields.stockMin }
      },
      include: { category: true }
    })
    return res.json(products)
  } catch (error) {
    console.error('Get low stock error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
