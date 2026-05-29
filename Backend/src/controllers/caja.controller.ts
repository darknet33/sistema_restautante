import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { emitCajaOpened, emitCajaClosed } from '../socket/emitter'

export async function getCurrent(req: Request, res: Response) {
  try {
    const session = await prisma.cajaSession.findFirst({
      where: { status: 'ABIERTA' },
      include: { user: { select: { id: true, name: true, username: true } } },
      orderBy: { openedAt: 'desc' }
    })
    return res.json(session)
  } catch (error) {
    console.error('Get current caja error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function openCaja(req: Request, res: Response) {
  try {
    const { openingAmount } = req.body
    if (openingAmount === undefined || Number(openingAmount) < 0) {
      return res.status(400).json({ message: 'Monto inicial inválido' })
    }

    const open = await prisma.cajaSession.findFirst({ where: { status: 'ABIERTA' } })
    if (open) return res.status(400).json({ message: 'Ya hay una caja abierta' })

    const session = await prisma.cajaSession.create({
      data: {
        userId: req.user!.userId,
        openingAmount: Number(openingAmount)
      },
      include: { user: { select: { id: true, name: true, username: true } } }
    })

    emitCajaOpened(session)
    return res.status(201).json(session)
  } catch (error) {
    console.error('Open caja error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function closeCaja(req: Request, res: Response) {
  try {
    const { closingAmount } = req.body
    if (closingAmount === undefined || Number(closingAmount) < 0) {
      return res.status(400).json({ message: 'Monto final inválido' })
    }

    const session = await prisma.cajaSession.findFirst({ where: { status: 'ABIERTA' } })
    if (!session) return res.status(400).json({ message: 'No hay caja abierta' })

    const closed = await prisma.cajaSession.update({
      where: { id: session.id },
      data: {
        closingAmount: Number(closingAmount),
        closedAt: new Date(),
        status: 'CERRADA'
      },
      include: { user: { select: { id: true, name: true, username: true } } }
    })

    emitCajaClosed(closed)
    return res.json(closed)
  } catch (error) {
    console.error('Close caja error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getHistory(req: Request, res: Response) {
  try {
    const sessions = await prisma.cajaSession.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { openedAt: 'desc' },
      take: 50
    })
    return res.json(sessions)
  } catch (error) {
    console.error('Get caja history error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
