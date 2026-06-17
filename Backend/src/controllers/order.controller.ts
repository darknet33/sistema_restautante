import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { emitOrderCreated, emitOrderStatusChanged, emitStockLow } from '../socket/emitter'
import { generateKitchenTicket, generateCustomerReceipt } from '../services/pdf.service'
import { printToKitchen, printToCashier } from '../services/printer.service'

export async function createOrder(req: Request, res: Response) {
  try {
    const { tableId, items, notes, orderType, deliveryAddress, deliveryPhone } = req.body
    const type = orderType || 'PARA_AQUI'

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items son requeridos' })
    }

    const validTypes = ['PARA_AQUI', 'PARA_LLEVAR', 'DELIVERY']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Tipo de pedido inválido' })
    }

    if (type === 'PARA_AQUI') {
      if (!tableId) {
        return res.status(400).json({ message: 'tableId es requerido para pedidos para aquí' })
      }
      const table = await prisma.table.findUnique({ where: { id: Number(tableId) } })
      if (!table) return res.status(404).json({ message: 'Mesa no encontrada' })

      const activeOrder = await prisma.order.findFirst({
        where: { tableId: Number(tableId), status: { not: 'PAGADO' } }
      })
      if (activeOrder) {
        return res.status(400).json({ message: 'La mesa ya tiene un pedido activo' })
      }
    }

    if (type === 'DELIVERY') {
      if (!deliveryAddress || !deliveryPhone) {
        return res.status(400).json({ message: 'Dirección y teléfono son requeridos para delivery' })
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      let total = 0
      let totalCost = 0
      const orderItemsData = []

      for (const item of items) {
        let unitPrice = 0
        let costPrice = 0
        if (item.dishId) {
          const dish = await tx.dish.findUnique({ where: { id: Number(item.dishId) } })
          if (!dish) throw new Error(`Plato ${item.dishId} no encontrado`)
          unitPrice = Number(dish.price)
          costPrice = Number(dish.cost)
        } else if (item.supplyId) {
          const supply = await tx.supply.findUnique({ where: { id: Number(item.supplyId) } })
          if (!supply) throw new Error(`Consumible ${item.supplyId} no encontrado`)
          unitPrice = Number(supply.salePrice)
          costPrice = Number(supply.purchaseCost)
        }

        const qty = Number(item.quantity) || 1
        total += unitPrice * qty
        totalCost += costPrice * qty

        orderItemsData.push({
          dishId: item.dishId ? Number(item.dishId) : null,
          supplyId: item.supplyId ? Number(item.supplyId) : null,
          type: item.dishId ? 'dish' : 'supply',
          quantity: qty,
          unitPrice,
          costPrice,
          notes: item.notes || null
        })
      }

      const created = await tx.order.create({
        data: {
          tableId: type === 'PARA_AQUI' && tableId ? Number(tableId) : undefined,
          userId: req.user!.userId,
          orderType: type,
          notes: notes || null,
          total,
          deliveryAddress: type === 'DELIVERY' ? deliveryAddress : undefined,
          deliveryPhone: type === 'DELIVERY' ? deliveryPhone : undefined,
          items: { create: orderItemsData }
        },
        include: {
          items: { include: { dish: true, supply: true } },
          table: true,
          user: { select: { id: true, name: true } }
        }
      })

      if (type === 'PARA_AQUI') {
        await tx.table.update({
          where: { id: Number(tableId) },
          data: { status: 'OCUPADA' }
        })
      }

      return created
    })

    emitOrderCreated(order)

    try {
      await printToKitchen(order)
    } catch (printErr) {
      console.error('Error printing kitchen ticket:', printErr)
    }

    return res.status(201).json(order)
  } catch (error: any) {
    console.error('Create order error:', error)
    return res.status(500).json({ message: error.message || 'Error interno del servidor' })
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const { status, tableId, orderType } = req.query
    const where: any = {}
    if (status) where.status = status
    if (tableId) where.tableId = Number(tableId)
    if (orderType) where.orderType = orderType

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { dish: true, supply: true } },
        table: true,
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return res.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: { include: { dish: true, supply: true } },
        table: true,
        user: { select: { id: true, name: true } }
      }
    })
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' })
    return res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function serveItem(req: Request, res: Response) {
  try {
    const { orderId, itemId } = req.params
    const item = await prisma.orderItem.findUnique({
      where: { id: Number(itemId) },
      include: { order: true, supply: true }
    })
    if (!item || item.orderId !== Number(orderId)) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    const updated = await prisma.orderItem.update({
      where: { id: Number(itemId) },
      data: { served: true },
      include: { dish: true, supply: true }
    })

    if (item.type === 'supply' && item.supply?.isInventoryTracked) {
      const supply = await prisma.supply.findUnique({ where: { id: item.supplyId! } })
      if (supply) {
        const stockBefore = Number(supply.stockCurrent)
        const qty = Number(item.quantity)
        const newStock = Math.max(0, stockBefore - qty)

        await prisma.supply.update({
          where: { id: item.supplyId! },
          data: { stockCurrent: newStock }
        })

        await prisma.inventoryMovement.create({
          data: {
            supplyId: item.supplyId!,
            type: 'MERMA',
            quantity: qty,
            stockBefore,
            stockAfter: newStock,
            userId: req.user!.userId
          }
        })

        if (newStock <= Number(supply.stockMin)) {
          const { emitStockLow } = await import('../socket/emitter')
          emitStockLow({ ...supply, stockCurrent: newStock })
        }
      }
    }

    return res.json(updated)
  } catch (error) {
    console.error('Serve item error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['PENDIENTE', 'EN_COCINA', 'LISTO', 'SERVIDO', 'PAGADO']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' })
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { items: true }
    })
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' })

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        items: { include: { dish: true, supply: true } },
        table: true,
        user: { select: { id: true, name: true } }
      }
    })

    if (status === 'PAGADO' && order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'LIBRE' }
      })
    }

    if (status === 'PAGADO') {
      try {
        await printToCashier(updated, 'customer')
      } catch (printErr) {
        console.error('Error printing receipt:', printErr)
      }
    }

    emitOrderStatusChanged(updated)

    if (status === 'EN_COCINA') {
      for (const item of order.items) {
        if (item.type === 'supply' && item.supplyId) {
          const supply = await prisma.supply.findUnique({ where: { id: item.supplyId } })
          if (supply && Number(supply.stockCurrent) <= Number(supply.stockMin)) {
            emitStockLow(supply)
          }
        }
      }
    }

    return res.json(updated)
  } catch (error) {
    console.error('Update order status error:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export async function getKitchenTicket(req: Request, res: Response) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: { include: { dish: true, supply: true } },
        table: true,
        user: { select: { id: true, name: true } }
      }
    })
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' })

    const pdfBuffer = await generateKitchenTicket(order)
    res.contentType('application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="ticket-cocina-${order.id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Get kitchen ticket error:', error)
    return res.status(500).json({ message: 'Error al generar ticket de cocina' })
  }
}

export async function getCustomerReceipt(req: Request, res: Response) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: { include: { dish: true, supply: true } },
        table: true,
        user: { select: { id: true, name: true } }
      }
    })
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' })

    const pdfBuffer = await generateCustomerReceipt(order)
    res.contentType('application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="recibo-${order.id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Get receipt error:', error)
    return res.status(500).json({ message: 'Error al generar recibo' })
  }
}

