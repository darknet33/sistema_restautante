import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { OrderStatus, MovementType } from '@prisma/client'
import { emitOrderCreated, emitOrderStatusChanged, emitStockLow } from '../socket/emitter'
import { printToKitchen, printToCashier } from '../services/printer.service'

export async function createOrder(req: Request, res: Response) {
  try {
    const { tableId, items, notes } = req.body
    const userId = req.user!.userId

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'tableId and items array required' })
    }

    const table = await prisma.table.findUnique({ where: { id: Number(tableId) } })
    if (!table) return res.status(404).json({ message: 'Table not found' })

    const activeOrder = await prisma.order.findFirst({
      where: { tableId: Number(tableId), status: { not: 'PAGADO' } }
    })
    if (activeOrder) {
      return res.status(409).json({ message: 'Table already has an active order' })
    }

    const order = await prisma.order.create({
      data: {
        tableId: Number(tableId),
        userId,
        notes,
        status: 'PENDIENTE',
        items: {
          create: items.map((item: any) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            unitPrice: 0,
            notes: item.notes
          }))
        }
      },
      include: { items: { include: { product: true } }, table: true, user: true }
    })

    for (const item of order.items) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { unitPrice: item.product.price }
      })
    }

    const total = order.items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0)
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { total },
      include: { items: { include: { product: true } }, table: true, user: true }
    })

    await prisma.table.update({
      where: { id: Number(tableId) },
      data: { status: 'OCUPADA' }
    })

    emitOrderCreated(updatedOrder)

    await printToKitchen(updatedOrder)
    await printToCashier(updatedOrder, 'waiter')

    return res.status(201).json(updatedOrder)
  } catch (error) {
    console.error('Create order error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const { status, tableId } = req.query
    const where: any = {}
    if (status) where.status = status
    if (tableId) where.tableId = Number(tableId)

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, table: true, user: true },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, table: true, user: true }
    })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    return res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    const { status } = req.body
    const userId = req.user!.userId

    if (!status) return res.status(400).json({ message: 'Status required' })

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, table: true }
    })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (status === 'EN_COCINA' && order.status === 'PENDIENTE') {
      const inventoryItems = order.items.filter(item => item.product.isInventoryTracked)

      for (const item of inventoryItems) {
        if (Number(item.product.stockCurrent) < Number(item.quantity)) {
          return res.status(400).json({
            message: `Stock insuficiente para ${item.product.name}. Disponible: ${item.product.stockCurrent}, Solicitado: ${item.quantity}`
          })
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const item of inventoryItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          })
          if (!product) continue

          const stockBefore = Number(product.stockCurrent)
          const stockAfter = stockBefore - Number(item.quantity)

          await tx.product.update({
            where: { id: product.id },
            data: { stockCurrent: stockAfter }
          })

          await tx.inventoryMovement.create({
            data: {
              productId: product.id,
              type: 'VENTA',
              quantity: Number(item.quantity),
              stockBefore,
              stockAfter,
              userId
            }
          })
        }

        await tx.order.update({
          where: { id },
          data: { status: 'EN_COCINA' as OrderStatus }
        })
      })
    } else {
      const data: any = { status }
      if (status === 'PAGADO') {
        data.table = { update: { status: 'LIBRE' } }
      }
      await prisma.order.update({
        where: { id },
        data
      })
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, table: true, user: true }
    })

    if (updatedOrder) {
      emitOrderStatusChanged(updatedOrder)

      for (const item of updatedOrder.items) {
        if (item.product.isInventoryTracked && Number(item.product.stockCurrent) <= Number(item.product.stockMin)) {
          emitStockLow(item.product)
        }
      }

      if (status === 'PAGADO') {
        await printToCashier(updatedOrder, 'customer')
        await prisma.table.update({
          where: { id: updatedOrder.tableId },
          data: { status: 'LIBRE' }
        })
      }
    }

    return res.json(updatedOrder)
  } catch (error) {
    console.error('Update order status error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
