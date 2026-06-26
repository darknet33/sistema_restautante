import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, ExternalLink } from 'lucide-react'

interface TicketPreviewModalProps {
  open: boolean
  url: string
  title: string
  onClose: () => void
}

export default function TicketPreviewModal({ open, url, title, onClose }: TicketPreviewModalProps) {
  const embedRef = useRef<HTMLEmbedElement>(null)

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
    if (embedRef.current) {
      try { embedRef.current.focus(); (embedRef.current as any).execCommand?.('print') } catch {}
    }
  }

  const handleOpenNewTab = () => {
    window.open(url, '_blank')
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border/50 dark:border-dark-border/50">
        <div className="flex items-center justify-between p-5 border-b border-border/50 dark:border-dark-border/50">
          <h2 className="text-lg font-heading font-bold dark:text-dark-text">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-4 py-2 bg-altipiqui-indigo text-white rounded-xl hover:bg-altipiqui-indigo-dark transition-all duration-200 text-sm font-medium active:scale-[0.97]"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir
            </button>
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
          <embed ref={embedRef} src={url} type="application/pdf" className="w-full h-[70vh] rounded-xl border border-border/50 dark:border-dark-border/50" />
        </div>
      </div>
    </div>,
    document.body
  )
}
