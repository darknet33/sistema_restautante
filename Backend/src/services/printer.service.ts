import net from 'net'

const LINE = '─'.repeat(40)
const DOUBLE_LINE = '═'.repeat(40)

function escposInit(): Buffer {
  return Buffer.from([0x1B, 0x40]) // ESC @
}

function escposCenter(): Buffer {
  return Buffer.from([0x1B, 0x61, 0x01]) // ESC a 1
}

function escposLeft(): Buffer {
  return Buffer.from([0x1B, 0x61, 0x00]) // ESC a 0
}

function escposDoubleHeight(): Buffer {
  return Buffer.from([0x1B, 0x21, 0x10]) // ESC ! 0x10
}

function escposNormal(): Buffer {
  return Buffer.from([0x1B, 0x21, 0x00]) // ESC ! 0x00
}

function escposBold(on: boolean): Buffer {
  return Buffer.from([0x1B, 0x45, on ? 0x01 : 0x00]) // ESC E
}

function escposCut(): Buffer {
  return Buffer.from([0x1D, 0x56, 0x00]) // GS V 0
}

function escposFeed(n: number): Buffer {
  return Buffer.from([0x1B, 0x64, n]) // ESC d n
}

function textLine(text: string): Buffer {
  return Buffer.from(text + '\n')
}

function buildKitchenTicket(order: any): Buffer {
  const parts: Buffer[] = [escposInit()]
  const hasTable = order.orderType === 'PARA_AQUI' && order.table

  const mesaText = hasTable
    ? `Mesa: ${order.table.number || order.tableId}`
    : order.orderType === 'DELIVERY'
      ? 'DELIVERY'
      : 'PARA LLEVAR'

  // Header
  parts.push(escposCenter())
  parts.push(escposDoubleHeight())
  parts.push(textLine('ALTIPIQUI'))
  parts.push(escposNormal())
  parts.push(textLine('Restaurante para todos'))
  parts.push(textLine(DOUBLE_LINE))
  parts.push(textLine(''))

  // Title
  parts.push(escposBold(true))
  parts.push(textLine('TICKET COCINA'))
  parts.push(escposBold(false))
  parts.push(textLine(''))

  // Order info
  parts.push(escposLeft())
  parts.push(escposBold(true))
  parts.push(textLine(`${mesaText.padEnd(24)} #${order.id}`))
  if (order.user?.name) {
    parts.push(textLine(`Mesero: ${order.user.name}`))
  }
  if (order.orderType === 'DELIVERY') {
    if (order.deliveryAddress) parts.push(textLine(`Dir: ${order.deliveryAddress}`))
    if (order.deliveryPhone) parts.push(textLine(`Tel: ${order.deliveryPhone}`))
  }
  parts.push(textLine(`Hora: ${new Date(order.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`))
  parts.push(escposBold(false))
  parts.push(textLine(''))
  parts.push(textLine(LINE))
  parts.push(textLine(''))

  // Items
  const dishItems = (order.items || []).filter((i: any) => i.type === 'dish')
  const supplyItems = (order.items || []).filter((i: any) => i.type === 'supply')

  if (dishItems.length > 0) {
    parts.push(escposBold(true))
    parts.push(textLine('PLATOS'))
    parts.push(escposBold(false))
    for (const item of dishItems) {
      const name = item.dish?.name || 'Producto'
      const qty = Number(item.quantity)
      parts.push(textLine(`  x${qty}  ${name}`))
      if (item.notes) {
        parts.push(textLine(`    * ${item.notes}`))
      }
    }
  }

  if (supplyItems.length > 0) {
    if (dishItems.length > 0) parts.push(textLine(''))
    parts.push(escposBold(true))
    parts.push(textLine('BEBIDAS / EXTRAS'))
    parts.push(escposBold(false))
    for (const item of supplyItems) {
      const name = item.supply?.name || 'Producto'
      const qty = Number(item.quantity)
      parts.push(textLine(`  x${qty}  ${name}`))
    }
  }

  // Notes
  if (order.notes) {
    parts.push(textLine(''))
    parts.push(textLine(LINE))
    parts.push(textLine(`Notas: ${order.notes}`))
  }

  // Footer
  parts.push(textLine(''))
  parts.push(textLine(LINE))
  parts.push(escposFeed(3))
  parts.push(escposCut())

  return Buffer.concat(parts)
}

function buildCustomerReceipt(order: any): Buffer {
  const parts: Buffer[] = [escposInit()]
  const hasTable = order.orderType === 'PARA_AQUI' && order.table

  const mesaText = hasTable
    ? `Mesa: ${order.table.number || order.tableId}`
    : order.orderType === 'DELIVERY'
      ? 'DELIVERY'
      : 'PARA LLEVAR'

  // Header
  parts.push(escposCenter())
  parts.push(escposDoubleHeight())
  parts.push(textLine('ALTIPIQUI'))
  parts.push(escposNormal())
  parts.push(textLine('Restaurante para todos'))
  parts.push(textLine(DOUBLE_LINE))
  parts.push(textLine(''))

  // Title
  parts.push(escposBold(true))
  parts.push(textLine('CUENTA'))
  parts.push(escposBold(false))
  parts.push(textLine(''))

  // Order info
  parts.push(escposLeft())
  parts.push(escposBold(true))
  parts.push(textLine(`${mesaText.padEnd(24)} #${order.id}`))
  parts.push(escposBold(false))
  if (order.user?.name) {
    parts.push(textLine(`Mesero: ${order.user.name}`))
  }
  parts.push(textLine(''))
  parts.push(textLine(LINE))
  parts.push(textLine(''))

  // Items with prices
  const dishItems = (order.items || []).filter((i: any) => i.type === 'dish')
  const supplyItems = (order.items || []).filter((i: any) => i.type === 'supply')

  if (dishItems.length > 0) {
    parts.push(escposBold(true))
    parts.push(textLine('PLATOS'))
    parts.push(escposBold(false))
    for (const item of dishItems) {
      const name = item.dish?.name || 'Producto'
      const qty = Number(item.quantity)
      const subtotal = qty * Number(item.unitPrice)
      const line = `  x${qty}  ${name.padEnd(22)} ${subtotal.toFixed(2)}`
      parts.push(textLine(line))
    }
  }

  if (supplyItems.length > 0) {
    if (dishItems.length > 0) parts.push(textLine(''))
    parts.push(escposBold(true))
    parts.push(textLine('BEBIDAS / EXTRAS'))
    parts.push(escposBold(false))
    for (const item of supplyItems) {
      const name = item.supply?.name || 'Producto'
      const qty = Number(item.quantity)
      const subtotal = qty * Number(item.unitPrice)
      const line = `  x${qty}  ${name.padEnd(22)} ${subtotal.toFixed(2)}`
      parts.push(textLine(line))
    }
  }

  // Total
  parts.push(textLine(''))
  parts.push(textLine(LINE))
  parts.push(textLine(''))
  parts.push(escposBold(true))
  const totalLine = `TOTAL:${' '.repeat(18)}Bs. ${Number(order.total).toFixed(2)}`
  parts.push(textLine(totalLine))
  parts.push(escposBold(false))
  parts.push(textLine(''))
  parts.push(textLine(LINE))

  // Footer
  parts.push(textLine(''))
  parts.push(escposCenter())
  parts.push(textLine('Gracias por su visita!'))
  parts.push(escposFeed(4))
  parts.push(escposCut())

  return Buffer.concat(parts)
}

function printRaw(data: Buffer, ip: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(5000)

    socket.on('connect', () => {
      socket.write(data, (err) => {
        if (err) {
          socket.destroy()
          return reject(err)
        }
        socket.end()
        resolve()
      })
    })

    socket.on('error', (err) => {
      socket.destroy()
      reject(err)
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('Connection timeout'))
    })

    socket.connect(port, ip)
  })
}

function getPrinterIp(name: string): string {
  const key = `PRINTER_${name.toUpperCase()}_IP`
  return process.env[key] || ''
}

export async function printToKitchen(order: any): Promise<void> {
  const ip = getPrinterIp('kitchen')
  if (!ip) {
    console.log('[Kitchen Printer] No IP configured, PDF available for download')
    return
  }

  const port = Number(process.env.PRINTER_KITCHEN_PORT) || 9100
  const data = buildKitchenTicket(order)

  try {
    await printRaw(data, ip, port)
    console.log(`[Kitchen Printer] Ticket #${order.id} sent to ${ip}:${port}`)
  } catch (err) {
    console.error(`[Kitchen Printer] Failed to print #${order.id}:`, err)
    console.log('[Kitchen Printer] PDF available as fallback')
  }
}

export async function printToCashier(order: any, type: 'waiter' | 'customer'): Promise<void> {
  const printerName = type === 'customer' ? 'cashier' : 'kitchen'
  const ip = getPrinterIp(printerName)
  if (!ip) {
    console.log(`[${printerName} Printer] No IP configured, PDF available for download`)
    return
  }

  const port = Number(process.env[`PRINTER_${printerName.toUpperCase()}_PORT`]) || 9100
  const data = type === 'customer' ? buildCustomerReceipt(order) : buildKitchenTicket(order)

  try {
    await printRaw(data, ip, port)
    console.log(`[${printerName} Printer] ${type} receipt #${order.id} sent to ${ip}:${port}`)
  } catch (err) {
    console.error(`[${printerName} Printer] Failed to print #${order.id}:`, err)
    console.log(`[${printerName} Printer] PDF available as fallback`)
  }
}
