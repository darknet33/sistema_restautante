import { ChevronsUpDown, Check, PlusSquare } from 'lucide-react'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { Table } from '../types'

interface TableCanvasProps {
  tables: Table[]
  onTableClick?: (table: Table) => void
  editable?: boolean
  onSaveLayout?: (tables: Array<{ id: number; posX: number; posY: number; shape: string; width: number; height: number }>) => void
}

const statusColors: Record<string, string> = {
  LIBRE: 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/30',
  OCUPADA: 'bg-gradient-to-br from-altipiqui-red to-altipiqui-red-dark shadow-altipiqui-red/30',
  RESERVADA: 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/30',
  LIMPIEZA: 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/30',
}

const statusLabels: Record<string, string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  LIMPIEZA: 'Limpieza',
}

export default function TableCanvas({ tables, onTableClick, editable, onSaveLayout }: TableCanvasProps) {
  const [dragId, setDragId] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const dragPositions = useRef<Map<number, { posX: number; posY: number }>>(new Map())
  const [, setTick] = useState(0)
  const [scale, setScale] = useState(1)

  const contentBounds = useMemo(() => {
    const pad = 40
    const maxX = tables.reduce((max, t) => Math.max(max, (t.posX || 0) + (t.width || 80)), 0) + pad
    const maxY = tables.reduce((max, t) => Math.max(max, (t.posY || 0) + (t.height || 80)), 0) + pad
    return { width: Math.max(maxX, 600), height: Math.max(maxY, 400) }
  }, [tables])

  useEffect(() => {
    const container = canvasRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect
      if (width === 0) return
      const newScale = Math.min(1, width / contentBounds.width)
      setScale(newScale)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [contentBounds.width])

  const getPos = (table: Table) => {
    const drag = dragPositions.current.get(table.id)
    if (drag) return drag
    return { posX: table.posX, posY: table.posY }
  }

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, table: Table) => {
    if (!editable) return
    e.preventDefault()
    const pos = getClientPos(e)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    offsetRef.current = { x: pos.x - rect.left, y: pos.y - rect.top }
    setDragId(table.id)
  }, [editable])

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (dragId === null || !canvasRef.current) return
    e.preventDefault()
    const pos = getClientPos(e)
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, (pos.x - canvasRect.left - offsetRef.current.x) / scale)
    const y = Math.max(0, (pos.y - canvasRect.top - offsetRef.current.y) / scale)
    dragPositions.current.set(dragId, { posX: Math.round(x), posY: Math.round(y) })
    setTick(t => t + 1)
  }, [dragId, scale])

  const handleDragEnd = useCallback(() => {
    setDragId(null)
  }, [])

  const handleSave = () => {
    if (!onSaveLayout) return
    const data = tables.map(t => {
      const drag = dragPositions.current.get(t.id)
      return {
        id: t.id,
        posX: drag?.posX ?? t.posX ?? 100,
        posY: drag?.posY ?? t.posY ?? 100,
        shape: t.shape || 'circle',
        width: t.width || 80,
        height: t.height || 80,
      }
    })
    onSaveLayout(data)
  }

  useEffect(() => {
    if (!editable) dragPositions.current.clear()
  }, [editable])

  return (
    <div>
      {editable && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-text-muted">
            <ChevronsUpDown className="w-4 h-4" />
            <span>Arrastra las mesas para posicionarlas</span>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-altipiqui-red text-white text-sm rounded-xl hover:bg-altipiqui-red-dark transition-all duration-200 shadow-lg shadow-altipiqui-red/20 active:scale-[0.97]"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Guardar Layout
            </span>
          </button>
        </div>
      )}

      <div
        ref={canvasRef}
        className="relative bg-white dark:bg-dark-surface rounded-2xl border-2 border-dashed border-border dark:border-dark-border overflow-hidden"
        style={{ minHeight: 400, height: '60vh' }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: contentBounds.width,
            height: contentBounds.height,
            position: 'relative',
          }}
        >
          {tables.map((table) => {
            const { posX, posY } = getPos(table)
            const isDragging = dragId === table.id
            return (
              <div
                key={table.id}
                onClick={() => !editable && onTableClick?.(table)}
                onMouseDown={(e) => handleDragStart(e, table)}
                onTouchStart={(e) => handleDragStart(e, table)}
                className={`
                  absolute flex items-center justify-center cursor-pointer select-none touch-none
                  transition-all duration-150
                  ${editable ? 'cursor-grab active:cursor-grabbing' : 'hover:scale-105'}
                  ${statusColors[table.status] || 'bg-gradient-to-br from-gray-400 to-gray-500'}
                  ${isDragging ? 'scale-110 shadow-2xl z-10' : 'shadow-lg'}
                `}
                style={{
                  left: posX ?? 100 + (table.number * 20),
                  top: posY ?? 100 + (table.number * 20),
                  width: table.width || 80,
                  height: table.height || 80,
                  borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'square' ? '12px' : '16px',
                }}
              >
                <div className="text-center text-white pointer-events-none">
                  <div className="text-lg font-bold leading-tight">{table.number}</div>
                  <div className="text-[10px] opacity-80">{table.seats} as.</div>
                  {!editable && (
                    <div className="text-[8px] mt-0.5 opacity-70 font-medium">{statusLabels[table.status]}</div>
                  )}
                </div>
              </div>
            )
          })}

          {tables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-dark-text-muted">
              <PlusSquare className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No hay mesas configuradas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
