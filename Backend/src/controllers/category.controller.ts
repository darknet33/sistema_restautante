import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getAll(req: Request, res: Response) {
  try {
    const { type } = req.query
    const where: any = {}
    if (type) where.type = type

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    return res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, type } = req.body
    if (!name || !type) return res.status(400).json({ message: 'name y type son requeridos' })

    const category = await prisma.category.create({ data: { name, type } })
    return res.status(201).json(category)
  } catch (error) {
    console.error('Create category error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, type } = req.body
    if (!name) return res.status(400).json({ message: 'name es requerido' })

    const existing = await prisma.category.findUnique({ where: { id: Number(id) } })
    if (!existing) return res.status(404).json({ message: 'Categoría no encontrada' })

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name, ...(type && { type }) }
    })
    return res.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params

    const existing = await prisma.category.findUnique({ where: { id: Number(id) } })
    if (!existing) return res.status(404).json({ message: 'Categoría no encontrada' })

    const dishCount = await prisma.dish.count({ where: { categoryId: Number(id) } })
    const supplyCount = await prisma.supply.count({ where: { categoryId: Number(id) } })
    if (dishCount > 0 || supplyCount > 0) {
      return res.status(409).json({
        message: `No se puede eliminar: tiene ${dishCount} plato(s) y ${supplyCount} consumible(s) asociados`
      })
    }

    await prisma.category.delete({ where: { id: Number(id) } })
    return res.status(204).send()
  } catch (error) {
    console.error('Delete category error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
