import { Request, Response } from 'express'
import prisma from '../utils/prisma'
import { emitOrderCreated, emitOrderStatusChanged, emitStockLow } from '../socket/emitter'
import { generateKitchenTicket, generateCustomerReceipt } from '../services/pdf.service'

export async function createOrder(req: Request, res: Response) {
  try {
    const { tableId, items, notes } = req.body
    if (!tableId || !items || !items.length) {
      return res.status(400).json({ message: 'tableId e items son requeridos' })
    }

    const table = await prisma.table.findUnique({ where: { id: Number(tableId) } })
    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' })

    const activeOrder = await prisma.order.findFirst({
      where: { tableId: Number(tableId), status: { not: 'PAGADO' } }
    })
    if (activeOrder) {
      return res.status(400).json({ message: 'La mesa ya tiene un pedido activo' })
    }

    const order = await prisma.$transaction(async (tx) => {
      let total = 0
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
          tableId: Number(tableId),
          userId: req.user!.userId,
          notes: notes || null,
          total,
          items: { create: orderItemsData }
        },
        include: {
          items: { include: { dish: true, supply: true } },
          table: true,
          user: { select: { id: true, name: true } }
        }
      })

      await tx.table.update({
        where: { id: Number(tableId) },
        data: { status: 'OCUPADA' }
      })

      return created
    })

    emitOrderCreated(order)

    try {
      const pdfBuffer = await generateKitchenTicket(order)
    } catch (pdfErr) {
      console.error('PDF kitchen ticket error:', pdfErr)
    }

    return res.status(201).json(order)
  } catch (error: any) {
    console.error('Create order error:', error)
    return res.status(500).json({ message: error.message || 'Error interno del servidor' })
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

    let updated

    if (status === 'EN_COCINA') {
      updated = await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.type === 'supply' && item.supplyId) {
            const supply = await tx.supply.findUnique({ where: { id: item.supplyId } })
            if (supply?.isInventoryTracked) {
              const stockBefore = Number(supply.stockCurrent)
              const qty = Number(item.quantity)
              const newStock = Math.max(0, stockBefore - qty)

              await tx.supply.update({
                where: { id: item.supplyId },
                data: { stockCurrent: newStock }
              })

              await tx.inventoryMovement.create({
                data: {
                  supplyId: item.supplyId,
                  type: 'ENTRADA',
                  quantity: qty,
                  stockBefore,
                  stockAfter: newStock,
                  userId: req.user!.userId
                }
              })
            }
          }
        }
        return tx.order.update({
          where: { id: Number(id) },
          data: { status },
          include: {
            items: { include: { dish: true, supply: true } },
            table: true,
            user: { select: { id: true, name: true } }
          }
        })
      })
    } else {
      updated = await prisma.order.update({
        where: { id: Number(id) },
        data: { status },
        include: {
          items: { include: { dish: true, supply: true } },
          table: true,
          user: { select: { id: true, name: true } }
        }
      })

      if (status === 'PAGADO') {
        await prisma.table.update({
          where: { id: updated.tableId },
          data: { status: 'LIBRE' }
        })

        try {
          const pdfBuffer = await generateCustomerReceipt(updated)
        } catch (pdfErr) {
          console.error('PDF receipt error:', pdfErr)
        }
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
