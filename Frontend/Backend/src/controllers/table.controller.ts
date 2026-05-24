import { Request, Response } from 'express'
import prisma from '../utils/prisma'

export async function getTables(req: Request, res: Response) {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: { status: { not: 'PAGADO' } },
          include: { items: { include: { product: true } } }
        }
      }
    })
    return res.json(tables)
  } catch (error) {
    console.error('Get tables error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getTable(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { not: 'PAGADO' } },
          include: { items: { include: { product: true } } }
        }
      }
    })
    if (!table) return res.status(404).json({ message: 'Table not found' })
    return res.json(table)
  } catch (error) {
    console.error('Get table error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function createTable(req: Request, res: Response) {
  try {
    const { number, seats } = req.body
    if (!number) return res.status(400).json({ message: 'Table number required' })

    const table = await prisma.table.create({
      data: {
        number: Number(number),
        seats: seats ? Number(seats) : 4,
        status: 'LIBRE'
      }
    })
    return res.status(201).json(table)
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Table number already exists' })
    console.error('Create table error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function updateTableStatus(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const { status } = req.body
    if (!status) return res.status(400).json({ message: 'Status required' })

    const table = await prisma.table.update({
      where: { id },
      data: { status },
      include: {
        orders: {
          where: { status: { not: 'PAGADO' } },
          include: { items: { include: { product: true } } }
        }
      }
    })
    return res.json(table)
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Table not found' })
    console.error('Update table status error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
