import { useState, useRef, useCallback, useEffect } from 'react'
import type { Table } from '../types'

interface TableCanvasProps {
  tables: Table[]
  onTableClick?: (table: Table) => void
  editable?: boolean
  onSaveLayout?: (tables: Array<{ id: number; posX: number; posY: number; shape: string; width: number; height: number }>) => void
}

const statusColors: Record<string, string> = {
  LIBRE: 'bg-green-500',
  OCUPADA: 'bg-red-500',
  RESERVADA: 'bg-yellow-500',
  LIMPIEZA: 'bg-gray-400',
}

export default function TableCanvas({ tables, onTableClick, editable, onSaveLayout }: TableCanvasProps) {
  const [dragId, setDragId] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const dragPositions = useRef<Map<number, { posX: number; posY: number }>>(new Map())
  const [, setTick] = useState(0)

  const getPos = (table: Table) => {
    const drag = dragPositions.current.get(table.id)
    if (drag) return drag
    return { posX: table.posX, posY: table.posY }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    if (!editable) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setDragId(table.id)
  }, [editable])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragId === null || !canvasRef.current) return
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, e.clientX - canvasRect.left - offsetRef.current.x)
    const y = Math.max(0, e.clientY - canvasRect.top - offsetRef.current.y)
    dragPositions.current.set(dragId, { posX: Math.round(x), posY: Math.round(y) })
    setTick(t => t + 1)
  }, [dragId])

  const handleMouseUp = useCallback(() => {
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Arrastra las mesas para posicionarlas</p>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            💾 Guardar Layout
          </button>
        </div>
      )}

      <div
        ref={canvasRef}
        className="relative bg-white rounded-xl border-2 border-dashed border-gray-200"
        style={{ minHeight: 400, height: '60vh' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tables.map((table) => {
          const { posX, posY } = getPos(table)
          return (
            <div
              key={table.id}
              onClick={() => !editable && onTableClick?.(table)}
              onMouseDown={(e) => handleMouseDown(e, table)}
              className={`
                absolute flex items-center justify-center cursor-pointer select-none
                transition-shadow hover:shadow-lg
                ${editable ? 'cursor-grab active:cursor-grabbing' : ''}
                ${statusColors[table.status] || 'bg-gray-500'}
              `}
              style={{
                left: posX ?? 100 + (table.number * 20),
                top: posY ?? 100 + (table.number * 20),
                width: table.width || 80,
                height: table.height || 80,
                borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'square' ? '8px' : '12px',
              }}
            >
              <div className="text-center text-white pointer-events-none">
                <div className="text-lg font-bold">{table.number}</div>
                <div className="text-xs">{table.seats} as.</div>
              </div>
            </div>
          )
        })}

        {tables.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-gray-400">
            No hay mesas configuradas
          </p>
        )}
      </div>
    </div>
  )
}
