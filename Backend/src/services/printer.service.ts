import { Order } from '@prisma/client'

interface PrinterConfig {
  ip: string
  port: number
}

const printers: Record<string, PrinterConfig> = {
  cocina: { ip: process.env.PRINTER_KITCHEN_IP || '192.168.1.100', port: 9100 },
  caja: { ip: process.env.PRINTER_CASHIER_IP || '192.168.1.101', port: 9100 }
}

export function formatKitchenTicket(order: any): string {
  const lines = [
    'COMANDO DE COCINA',
    '================',
    `Pedido #${order.id}`,
    `Mesa: ${order.table?.number}`,
    `Hora: ${new Date().toLocaleTimeString()}`,
    '----------------',
    ...(order.items?.map((item: any) => `${item.quantity}x ${item.product?.name}`) || []),
    '----------------',
    order.notes ? `Notas: ${order.notes}` : '',
    '\n\n\n'
  ]
  return lines.join('\n')
}

export function formatWaiterTicket(order: any): string {
  const lines = [
    'FICHA DE PEDIDO',
    '================',
    `Pedido #${order.id}`,
    `Mesa: ${order.table?.number}`,
    `Mesero: ${order.user?.name}`,
    '----------------',
    ...(order.items?.map((item: any) => 
      `${item.quantity}x ${item.product?.name} - $${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}`) || []),
    '----------------',
    `TOTAL: $${Number(order.total).toFixed(2)}`,
    '\n\n\n'
  ]
  return lines.join('\n')
}

export function formatCustomerReceipt(order: any): string {
  const lines = [
    'RECIBO DE CLIENTE',
    '================',
    `Pedido #${order.id}`,
    `Mesa: ${order.table?.number}`,
    `Fecha: ${new Date().toLocaleString()}`,
    '----------------',
    ...(order.items?.map((item: any) => 
      `${item.quantity}x ${item.product?.name} - $${(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}`) || []),
    '----------------',
    `TOTAL: $${Number(order.total).toFixed(2)}`,
    '',
    'Gracias por su visita!',
    '\n\n\n'
  ]
  return lines.join('\n')
}

export async function printToKitchen(order: any): Promise<void> {
  const printer = printers.cocina
  const data = formatKitchenTicket(order)
  console.log(`[Kitchen Printer] Would print to ${printer.ip}:${printer.port}`)
  console.log(data)
  return Promise.resolve()
}

export async function printToCashier(order: any, type: 'waiter' | 'customer'): Promise<void> {
  const printer = printers.caja
  const data = type === 'waiter' ? formatWaiterTicket(order) : formatCustomerReceipt(order)
  console.log(`[Cashier Printer] Would print to ${printer.ip}:${printer.port}`)
  console.log(data)
  return Promise.resolve()
}
