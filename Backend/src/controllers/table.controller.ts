import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { emitTableLayoutUpdated } from '../socket/emitter'

export async function getTables(req: Request, res: Response) {
  try {
    const tables = await prisma.table.findMany({
      include: {
        orders: {
          where: { status: { not: 'PAGADO' } },
          include: {
            items: { include: { dish: true, supply: true } },
            user: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { number: 'asc' }
    })
    return res.json(tables)
  } catch (error) {
    console.error('Get tables error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getTable(req: Request, res: Response) {
  try {
    const table = await prisma.table.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        orders: {
          where: { status: { not: 'PAGADO' } },
          include: {
            items: { include: { dish: true, supply: true } },
            user: { select: { id: true, name: true } }
          }
        }
      }
    })
    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' })
    return res.json(table)
  } catch (error) {
    console.error('Get table error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function createTable(req: Request, res: Response) {
  try {
    const { number, seats } = req.body
    if (!number) return res.status(400).json({ message: 'Número de mesa requerido' })

    const table = await prisma.table.create({
      data: { number: Number(number), seats: Number(seats) || 4 }
    })
    return res.status(201).json(table)
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe una mesa con ese número' })
    console.error('Create table error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function updateTable(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status, posX, posY, shape, width, height, seats } = req.body
    const data: any = {}
    if (status) data.status = status
    if (posX !== undefined) data.posX = Number(posX)
    if (posY !== undefined) data.posY = Number(posY)
    if (shape) data.shape = shape
    if (width !== undefined) data.width = Number(width)
    if (height !== undefined) data.height = Number(height)
    if (seats !== undefined) data.seats = Number(seats)

    const table = await prisma.table.update({
      where: { id: Number(id) },
      data,
      include: {
        orders: {
          where: { status: { not: 'PAGADO' } },
          include: { items: { include: { dish: true, supply: true } } }
        }
      }
    })
    return res.json(table)
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Mesa no encontrada' })
    console.error('Update table error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function saveLayout(req: Request, res: Response) {
  try {
    const { tables } = req.body
    if (!Array.isArray(tables)) return res.status(400).json({ message: 'tables debe ser un array' })

    for (const t of tables) {
      await prisma.table.update({
        where: { id: t.id },
        data: {
          posX: t.posX ?? null,
          posY: t.posY ?? null,
          shape: t.shape || 'circle',
          width: t.width || 80,
          height: t.height || 80
        }
      })
    }

    const updated = await prisma.table.findMany({ orderBy: { number: 'asc' } })
    emitTableLayoutUpdated(updated)
    return res.json(updated)
  } catch (error) {
    console.error('Save layout error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
