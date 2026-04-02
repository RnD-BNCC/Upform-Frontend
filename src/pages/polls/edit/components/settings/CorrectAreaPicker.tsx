import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash } from '@phosphor-icons/react'

type Area = { x: number; y: number; width: number; height: number }

interface CorrectAreaPickerProps {
  imageUrl: string
  value?: Area
  onChange: (area: Area | undefined) => void
  onClose: () => void
}

export default function CorrectAreaPicker({ imageUrl, value, onChange, onClose }: CorrectAreaPickerProps) {
  const [draft, setDraft] = useState<Area | undefined>(value)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getRelative = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const pos = getRelative(e)
    startRef.current = pos
    setDragging(true)
    setDraft({ x: pos.x, y: pos.y, width: 0, height: 0 })
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!startRef.current) return
      const end = getRelative(e)
      const start = startRef.current
      setDraft({
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, getRelative])

  const handleConfirm = () => {
    if (draft && draft.width > 1 && draft.height > 1) {
      onChange(draft)
    }
    onClose()
  }

  const handleRemove = () => {
    onChange(undefined)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Mark out the correct area</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click and drag on the image to select the correct area</p>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          <div
            ref={containerRef}
            className="relative select-none rounded-lg overflow-hidden shadow-md max-w-full"
            style={{ cursor: 'crosshair', maxHeight: '60vh' }}
            onMouseDown={handleMouseDown}
          >
            <img
              src={imageUrl}
              alt=""
              className="block max-h-[60vh] w-auto"
              draggable={false}
            />
            {draft && draft.width > 0.5 && draft.height > 0.5 && (
              <div
                className="absolute pointer-events-none border-2 border-green-500"
                style={{
                  left: `${draft.x}%`,
                  top: `${draft.y}%`,
                  width: `${draft.width}%`,
                  height: `${draft.height}%`,
                  backgroundColor: 'rgba(34,197,94,0.2)',
                }}
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 font-medium cursor-pointer transition-colors"
          >
            <Trash size={13} weight="bold" />
            Remove correct area
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setDraft(undefined)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg cursor-pointer transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleConfirm}
              disabled={!draft || draft.width <= 1 || draft.height <= 1}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
