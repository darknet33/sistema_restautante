import type { Order } from '@/types'

interface PrinterConfig {
  ip: string
  port: number
}

const printers: Record<string, PrinterConfig> = {
  cocina: { ip: '192.168.1.100', port: 9100 },
  caja: { ip: '192.168.1.101', port: 9100 }
}

export async function printKitchenTicket(order: Order): Promise<void> {
  const printer = printers.cocina
  const lines = [
    'COMANDO DE COCINA',
    '================',
    `Pedido #${order.id}`,
    `Mesa: ${order.table?.number}`,
    `Hora: ${new Date().toLocaleTimeString()}`,
    '----------------',
    ...(order.items?.map(item => `${item.quantity}x ${item.product?.name}`) || []),
    '----------------',
    order.notes ? `Notas: ${order.notes}` : '',
    '\n\n\n'
  ]

  return sendToPrinter(printer, lines.join('\n'))
}

export async function printWaiterTicket(order: Order): Promise<void> {
  const printer = printers.caja
  const lines = [
    'FICHA DE PEDIDO',
    '================',
    `Pedido #${order.id}`,
    `Mesa: ${order.table?.number}`,
    `Mesero: ${order.user?.name}`,
    '----------------',
    ...(order.items?.map(item => `${item.quantity}x ${item.product?.name} - $${(item.unitPrice * item.quantity).toFixed(2)}`) || []),
    '----------------',
    `TOTAL: $${order.total.toFixed(2)}`,
    '\n\n\n'
  ]

  return sendToPrinter(printer, lines.join('\n'))
}

export async function printCustomerReceipt(order: Order): Promise<void> {
  const printer = printers.caja
  const lines = [
    'RECIBO DE CLIENTE',
    '================',
    `Pedido #${order.id}`,
    `Mesa: ${order.table?.number}`,
    `Fecha: ${new Date().toLocaleString()}`,
    '----------------',
    ...(order.items?.map(item => `${item.quantity}x ${item.product?.name} - $${(item.unitPrice * item.quantity).toFixed(2)}`) || []),
    '----------------',
    `TOTAL: $${order.total.toFixed(2)}`,
    '',
    'Gracias por su visita!',
    '\n\n\n'
  ]

  return sendToPrinter(printer, lines.join('\n'))
}

async function sendToPrinter(printer: PrinterConfig, data: string): Promise<void> {
  try {
    const response = await fetch(`http://${printer.ip}:${printer.port}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: data
    })
    if (!response.ok) throw new Error('Print failed')
  } catch (error) {
    console.error('Print error:', error)
    throw error
  }
}
