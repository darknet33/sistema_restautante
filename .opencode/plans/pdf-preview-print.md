# Plan: Vista Previa PDF + Impresión

Reemplazar botones de descarga de PDF con vista previa + impresión.

## 1. `Frontend/src/services/order.service.ts`

Reemplazar `downloadKitchenTicket` y `downloadCustomerReceipt`:

```typescript
export async function getKitchenTicketUrl(orderId: number): Promise<string> {
  const response = await api.get(`/orders/${orderId}/ticket`, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}

export async function getCustomerReceiptUrl(orderId: number): Promise<string> {
  const response = await api.get(`/orders/${orderId}/receipt`, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}
```

## 2. Crear `Frontend/src/components/TicketPreviewModal.tsx`

```typescript
import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'

interface TicketPreviewModalProps {
  open: boolean
  url: string
  title: string
  onClose: () => void
}

export default function TicketPreviewModal({ open, url, title, onClose }: TicketPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border/50 dark:border-dark-border/50">
        <div className="flex items-center justify-between p-5 border-b border-border/50 dark:border-dark-border/50">
          <h2 className="text-lg font-heading font-bold dark:text-dark-text">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-red text-white rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 text-sm font-medium active:scale-[0.97]"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-5 min-h-0">
          <iframe ref={iframeRef} src={url} className="w-full h-[70vh] rounded-xl border border-border/50 dark:border-dark-border/50" title={title} />
        </div>
      </div>
    </div>,
    document.body
  )
}
```

## 3. `Frontend/src/pages/waiter/NewOrder.tsx`

Cambios:
- Import: `downloadKitchenTicket` → `getKitchenTicketUrl`
- Import TicketPreviewModal
- Agregar estado: `previewUrl`, `previewTitle`, `showPreview`
- Reemplazar botón en el modal de éxito (líneas 437-444):

```tsx
{createdOrderId && (
  <button
    onClick={async () => {
      const url = await getKitchenTicketUrl(createdOrderId)
      setPreviewUrl(url)
      setPreviewTitle('Ticket Cocina')
      setShowPreview(true)
    }}
    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 border-2 border-altipiqui-red text-altipiqui-red rounded-xl hover:bg-altipiqui-red hover:text-white transition-all duration-200 font-medium text-sm active:scale-[0.97]"
  >
    <Printer className="w-4 h-4" />
    Ver Ticket Cocina
  </button>
)}
```

- Renderizar al final:
```tsx
<TicketPreviewModal open={showPreview} url={previewUrl} title={previewTitle} onClose={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl) }} />
```

## 4. `Frontend/src/pages/cajero/Dashboard.tsx`

Cambios:
- Import: `downloadCustomerReceipt` → `getCustomerReceiptUrl`
- Agregar imports de TicketPreviewModal, Printer
- Agregar estado: `previewUrl`, `previewTitle`, `showPreview`
- Reemplazar botón en modal pedido cobrado (líneas 239-245):

```tsx
<button
  onClick={async () => {
    const url = await getCustomerReceiptUrl(paidOrder.id)
    setPreviewUrl(url)
    setPreviewTitle('Recibo')
    setShowPreview(true)
  }}
  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 border-2 border-altipiqui-indigo text-altipiqui-indigo rounded-xl hover:bg-altipiqui-indigo hover:text-white transition-all duration-200 font-medium text-sm active:scale-[0.97]"
>
  <Printer className="w-4 h-4" />
  Ver Recibo
</button>
```

- Renderizar:
```tsx
<TicketPreviewModal open={showPreview} url={previewUrl} title={previewTitle} onClose={() => { setShowPreview(false); URL.revokeObjectURL(previewUrl) }} />
```

## 5. `Frontend/src/pages/admin/Caja.tsx`

Mismos cambios que cajero (líneas 347-353).

## 6. Prueba

1. `cd Backend && npm run dev`
2. `cd Frontend && npm run dev`
3. Iniciar sesión como mesero, crear pedido → verificar preview ticket cocina
4. Pagar pedido como cajero/admin → verificar preview recibo
5. Click "Imprimir" → debe abrir diálogo de impresión del navegador
