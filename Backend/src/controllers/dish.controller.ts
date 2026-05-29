import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import fs from 'fs'
import path from 'path'

export async function getAll(req: Request, res: Response) {
  try {
    const { category, available, menu } = req.query
    const where: any = {}
    if (category) where.categoryId = Number(category)
    if (available === 'true') where.isAvailable = true
    if (menu === 'true') where.isMenu = true

    const dishes = await prisma.dish.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' }
    })
    return res.json(dishes)
  } catch (error) {
    console.error('Get dishes error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true }
    })
    if (!dish) return res.status(404).json({ message: 'Plato no encontrado' })
    return res.json(dish)
  } catch (error) {
    console.error('Get dish error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, description, price, cost, categoryId, isAvailable, isMenu } = req.body
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null

    const dish = await prisma.dish.create({
      data: {
        name,
        description,
        price: Number(price),
        cost: Number(cost),
        categoryId: Number(categoryId),
        imageUrl,
        isAvailable: isAvailable === 'true' || isAvailable === true,
        isMenu: isMenu === 'true' || isMenu === true
      },
      include: { category: true }
    })
    return res.status(201).json(dish)
  } catch (error) {
    console.error('Create dish error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description, price, cost, categoryId, isAvailable, isMenu } = req.body
    const data: any = {}
    if (name) data.name = name
    if (description !== undefined) data.description = description
    if (price) data.price = Number(price)
    if (cost) data.cost = Number(cost)
    if (categoryId) data.categoryId = Number(categoryId)
    if (isAvailable !== undefined) data.isAvailable = isAvailable === 'true' || isAvailable === true
    if (isMenu !== undefined) data.isMenu = isMenu === 'true' || isMenu === true
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`

    const dish = await prisma.dish.update({
      where: { id: Number(id) },
      data,
      include: { category: true }
    })
    return res.json(dish)
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Plato no encontrado' })
    console.error('Update dish error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const { id } = req.params
    const dish = await prisma.dish.findUnique({ where: { id: Number(id) } })
    if (dish?.imageUrl) {
      const filePath = path.resolve(__dirname, '../../', dish.imageUrl.replace(/^\//, ''))
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    await prisma.dish.delete({ where: { id: Number(id) } })
    return res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Plato no encontrado' })
    console.error('Delete dish error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function uploadImage(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ message: 'No se proporcionó imagen' })

    const dish = await prisma.dish.findUnique({ where: { id: Number(id) } })
    if (!dish) return res.status(404).json({ message: 'Plato no encontrado' })

    if (dish.imageUrl) {
      const oldPath = path.resolve(__dirname, '../../', dish.imageUrl.replace(/^\//, ''))
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }

    const updated = await prisma.dish.update({
      where: { id: Number(id) },
      data: { imageUrl: `/uploads/${req.file.filename}` },
      include: { category: true }
    })
    return res.json(updated)
  } catch (error) {
    console.error('Upload image error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
