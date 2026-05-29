import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import QRCode from 'qrcode'

export async function getMenu(req: Request, res: Response) {
  try {
    const dishes = await prisma.dish.findMany({
      where: { isMenu: true, isAvailable: true },
      include: { category: true },
      orderBy: { categoryId: 'asc' }
    })
    return res.json(dishes)
  } catch (error) {
    console.error('Get menu error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function generateQR(req: Request, res: Response) {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const menuUrl = `${baseUrl}/menu`

    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })

    return res.json({ qrDataUrl, url: menuUrl })
  } catch (error) {
    console.error('Generate QR error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
