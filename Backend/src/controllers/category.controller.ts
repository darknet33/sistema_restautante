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
