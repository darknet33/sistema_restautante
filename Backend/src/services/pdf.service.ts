import PdfPrinter from 'pdfmake/js/Printer'
import path from 'path'
import fs from 'fs'

const fontDir = path.join(path.dirname(require.resolve('pdfmake/package.json')), 'fonts', 'Roboto')

const fonts = {
  Roboto: {
    normal: path.join(fontDir, 'Roboto-Regular.ttf'),
    bold: path.join(fontDir, 'Roboto-Medium.ttf'),
    italics: path.join(fontDir, 'Roboto-Italic.ttf'),
    bolditalics: path.join(fontDir, 'Roboto-MediumItalic.ttf'),
  }
}

const virtualfs = {
  existsSync: (filePath: string) => fs.existsSync(filePath),
  readFileSync: (filePath: string) => fs.readFileSync(filePath),
}

const urlResolver = {
  resolve: () => {},
  resolved: () => Promise.resolve(),
}

const printer = new (PdfPrinter as any)(fonts, virtualfs, urlResolver)

const LINE = '─'.repeat(40)
const DOUBLE_LINE = '═'.repeat(40)

function formatHeader(order: any) {
  const lines: any[] = [
    { text: 'ALTIPIQUI', style: 'title', alignment: 'center' as const },
    { text: 'Restaurante para todos', style: 'subtitle', alignment: 'center' as const, margin: [0, 0, 0, 4] },
    { text: DOUBLE_LINE, style: 'line', alignment: 'center' as const },
    { text: '', margin: [0, 2, 0, 0] },
  ]
  return lines
}

function formatOrderInfo(order: any) {
  const mesaText = order.orderType === 'PARA_AQUI'
    ? `Mesa: ${order.table?.number || order.tableId}`
    : order.orderType === 'DELIVERY'
      ? 'DELIVERY'
      : 'PARA LLEVAR'

  const lines: any[] = [
    {
      columns: [
        { text: mesaText, style: 'bold', width: '50%' },
        { text: `#${order.id}`, style: 'bold', alignment: 'right' as const, width: '50%' },
      ],
      margin: [0, 0, 0, 2]
    },
  ]

  if (order.user?.name) {
    lines.push({
      columns: [
        { text: `Mesero: ${order.user.name}`, style: 'normal', width: '100%' },
      ],
      margin: [0, 0, 0, 1]
    })
  }

  if (order.orderType === 'DELIVERY') {
    if (order.deliveryAddress) lines.push({ text: `Dirección: ${order.deliveryAddress}`, style: 'normal', margin: [0, 0, 0, 1] })
    if (order.deliveryPhone) lines.push({ text: `Teléfono: ${order.deliveryPhone}`, style: 'normal', margin: [0, 0, 0, 1] })
  }

  lines.push(
    { text: `Hora: ${new Date(order.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`, style: 'normal', margin: [0, 0, 0, 2] },
    { text: LINE, style: 'line', alignment: 'center' as const },
    { text: '', margin: [0, 1, 0, 0] },
  )

  return lines
}

function formatItems(items: any[], showPrices: boolean) {
  const body: any[] = []

  for (const item of items) {
    const name = item.dish?.name || item.supply?.name || 'Producto'
    const qty = Number(item.quantity)
    const price = Number(item.unitPrice)
    const subtotal = qty * price

    if (showPrices) {
      body.push({
        columns: [
          { text: `x${qty}`, width: 28, style: 'normal' },
          { text: name, width: '*', style: 'normal' },
          { text: `${subtotal.toFixed(2)}`, width: 50, alignment: 'right' as const, style: 'normal' },
        ],
        margin: [0, 0, 0, 1]
      })
    } else {
      body.push({
        columns: [
          { text: `x${qty}`, width: 28, style: 'normal' },
          { text: name, width: '*', style: 'normal' },
        ],
        margin: [0, 0, 0, 1]
      })
    }

    if (item.notes) {
      body.push({
        text: `  * ${item.notes}`,
        style: 'note',
        margin: [28, 0, 0, 2]
      })
    }
  }

  return body
}

export async function generateKitchenTicket(order: any): Promise<Buffer> {
  try {
    const dishItems = (order.items || []).filter((i: any) => i.type === 'dish')
    const supplyItems = (order.items || []).filter((i: any) => i.type === 'supply')

    const content: any[] = [
      ...formatHeader(order),
      { text: 'TICKET COCINA', style: 'subtitle', alignment: 'center' as const },
      { text: '', margin: [0, 2, 0, 0] },
      ...formatOrderInfo(order),
    ]

    if (dishItems.length > 0) {
      content.push(
        { text: 'PLATOS', style: 'section', margin: [0, 0, 0, 2] },
        ...formatItems(dishItems, false),
      )
    }

    if (supplyItems.length > 0) {
      if (dishItems.length > 0) content.push({ text: '', margin: [0, 2, 0, 0] })
      content.push(
        { text: 'BEBIDAS / EXTRAS', style: 'section', margin: [0, 0, 0, 2] },
        ...formatItems(supplyItems, false),
      )
    }

    if (order.notes) {
      content.push(
        { text: '', margin: [0, 2, 0, 0] },
        { text: LINE, style: 'line', alignment: 'center' as const },
        { text: `Notas: ${order.notes}`, style: 'note', margin: [0, 4, 0, 0] },
      )
    }

    content.push(
      { text: '', margin: [0, 4, 0, 0] },
      { text: LINE, style: 'line', alignment: 'center' as const },
      { text: '', margin: [0, 4, 0, 0] },
      { text: '¡Buen provecho!', alignment: 'center' as const, style: 'footer' },
    )

    const docDefinition: any = {
      pageSize: { width: 80 * 2.83, height: 'auto' },
      pageMargins: [8, 8, 8, 8],
      content,
      styles: {
        title: { fontSize: 14, bold: true, font: 'Roboto' },
        subtitle: { fontSize: 10, bold: true, font: 'Roboto' },
        section: { fontSize: 9, bold: true, font: 'Roboto', decoration: 'underline' },
        bold: { fontSize: 9, bold: true, font: 'Roboto' },
        normal: { fontSize: 9, font: 'Roboto' },
        note: { fontSize: 8, italics: true, font: 'Roboto', color: '#666666' },
        line: { fontSize: 8, font: 'Roboto' },
        footer: { fontSize: 8, color: '#999999' },
      }
    }

    const pdfDoc = await printer.createPdfKitDocument(docDefinition)
    const chunks: Buffer[] = []
    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)
      pdfDoc.end()
    })
  } catch (e) {
    throw e
  }
}

export async function generateCustomerReceipt(order: any): Promise<Buffer> {
  try {
    const dishItems = (order.items || []).filter((i: any) => i.type === 'dish')
    const supplyItems = (order.items || []).filter((i: any) => i.type === 'supply')

    const content: any[] = [
      ...formatHeader(order),
      { text: 'CUENTA', style: 'subtitle', alignment: 'center' as const },
      { text: '', margin: [0, 2, 0, 0] },
      ...formatOrderInfo(order),
    ]

    if (dishItems.length > 0) {
      content.push(
        { text: 'PLATOS', style: 'section', margin: [0, 0, 0, 2] },
        ...formatItems(dishItems, true),
      )
    }

    if (supplyItems.length > 0) {
      if (dishItems.length > 0) content.push({ text: '', margin: [0, 2, 0, 0] })
      content.push(
        { text: 'BEBIDAS / EXTRAS', style: 'section', margin: [0, 0, 0, 2] },
        ...formatItems(supplyItems, true),
      )
    }

    content.push(
      { text: '', margin: [0, 2, 0, 0] },
      { text: LINE, style: 'line', alignment: 'center' as const },
      { text: '', margin: [0, 2, 0, 0] },
      {
        columns: [
          { text: 'TOTAL:', width: '*', style: 'total' },
          { text: `Bs. ${Number(order.total).toFixed(2)}`, width: 80, alignment: 'right' as const, style: 'total' },
        ],
        margin: [0, 0, 0, 0]
      },
      { text: '', margin: [0, 2, 0, 0] },
      { text: LINE, style: 'line', alignment: 'center' as const },
      { text: '', margin: [0, 6, 0, 0] },
      { text: '¡Gracias por su visita!', alignment: 'center' as const, style: 'footer' },
    )

    const docDefinition: any = {
      pageSize: { width: 80 * 2.83, height: 'auto' },
      pageMargins: [8, 8, 8, 8],
      content,
      styles: {
        title: { fontSize: 14, bold: true, font: 'Roboto' },
        subtitle: { fontSize: 10, bold: true, font: 'Roboto' },
        section: { fontSize: 9, bold: true, font: 'Roboto', decoration: 'underline' },
        bold: { fontSize: 9, bold: true, font: 'Roboto' },
        normal: { fontSize: 9, font: 'Roboto' },
        note: { fontSize: 8, italics: true, font: 'Roboto', color: '#666666' },
        line: { fontSize: 8, font: 'Roboto' },
        total: { fontSize: 11, bold: true, font: 'Roboto' },
        footer: { fontSize: 8, color: '#999999' },
      }
    }

    const pdfDoc = await printer.createPdfKitDocument(docDefinition)
    const chunks: Buffer[] = []
    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)
      pdfDoc.end()
    })
  } catch (e) {
    throw e
  }
}
