import PdfPrinter from 'pdfmake/js/Printer'

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

const printer = new (PdfPrinter as any)(fonts, null, { resolve: () => '' })

export async function generateKitchenTicket(order: any): Promise<Buffer> {
  try {
    const items = (order.items || []).map((item: any) => {
      const name = item.dish?.name || item.supply?.name || 'Producto'
      const notes = item.notes ? `\n  📝 ${item.notes}` : ''
      return `  x${item.quantity}  ${name}${notes}`
    }).join('\n')

    const docDefinition: any = {
      pageSize: { width: 80 * 2.83, height: 'auto' },
      pageMargins: [10, 10, 10, 10],
      content: [
        { text: '=== TICKET COCINA ===', style: 'header', alignment: 'center' },
        { text: `Mesa: ${order.table?.number || order.tableId}`, style: 'subheader' },
        { text: `Orden #${order.id}`, style: 'subheader' },
        { text: `Hora: ${new Date(order.createdAt).toLocaleTimeString()}`, margin: [0, 0, 0, 8] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
        { text: '\n' + items + '\n', margin: [0, 4, 0, 4] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
        order.notes ? { text: `Notas generales: ${order.notes}`, margin: [0, 4, 0, 0] } : {},
        { text: '\nGracias!', alignment: 'center', color: 'gray', fontSize: 8 }
      ],
      styles: {
        header: { fontSize: 12, bold: true, margin: [0, 0, 0, 4] },
        subheader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] }
      }
    }

    const pdfDoc = await printer.createPdfKitDocument(docDefinition)
    const chunks: Buffer[] = []
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
    pdfDoc.on('end', () => {})
    return new Promise((resolve, reject) => {
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
    const itemsLines = (order.items || []).map((item: any) => {
      const name = item.dish?.name || item.supply?.name || 'Producto'
      const qty = Number(item.quantity)
      const price = Number(item.unitPrice)
      const subtotal = qty * price
      return [
        { text: `x${qty}`, alignment: 'left', width: 30 },
        { text: name, alignment: 'left', width: 100 },
        { text: `${price.toFixed(2)}`, alignment: 'right', width: 40 },
        { text: `${subtotal.toFixed(2)}`, alignment: 'right', width: 40 }
      ]
    })

    const docDefinition: any = {
      pageSize: { width: 80 * 2.83, height: 'auto' },
      pageMargins: [10, 10, 10, 10],
      content: [
        { text: '=== CUENTA ===', style: 'header', alignment: 'center' },
        { text: `Mesa: ${order.table?.number || order.tableId}`, style: 'subheader' },
        { text: `Orden #${order.id}`, margin: [0, 0, 0, 8] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
        { text: '\n' },
        {
          layout: 'noBorders',
          table: {
            headerRows: 1,
            widths: [30, 100, 40, 40],
            body: [
              [
                { text: 'Cant', style: 'tableHeader' },
                { text: 'Producto', style: 'tableHeader' },
                { text: 'P/U', style: 'tableHeader', alignment: 'right' },
                { text: 'Subtotal', style: 'tableHeader', alignment: 'right' }
              ],
              ...itemsLines,
              [
                {},
                {},
                { text: 'TOTAL:', style: 'total', alignment: 'right', colSpan: 1 },
                { text: `${Number(order.total).toFixed(2)}`, style: 'total', alignment: 'right' }
              ]
            ]
          }
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
        { text: '\n¡Gracias por su visita!', alignment: 'center', color: 'gray', fontSize: 10 }
      ],
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 4] },
        subheader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
        tableHeader: { fontSize: 9, bold: true, color: 'gray' },
        total: { fontSize: 11, bold: true }
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
