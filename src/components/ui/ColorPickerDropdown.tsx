import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react'

interface ColorPickerDropdownProps {
  value: string
  onChange: (color: string) => void
  colors: string[]
  triggerClassName?: string
  swatchClassName?: string
  showCaret?: boolean
  swatchSize?: 'sm' | 'md'
  direction?: 'up' | 'down'
  align?: 'left' | 'right'
  useMouseDown?: boolean
}

export default function ColorPickerDropdown({
  value,
  onChange,
  colors,
  triggerClassName,
  swatchClassName,
  showCaret = true,
  swatchSize = 'md',
  direction = 'down',
  align = 'right',
  useMouseDown = false,
}: ColorPickerDropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<React.CSSProperties>({})

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 6
    const next: React.CSSProperties = { position: 'fixed', zIndex: 9999 }

    if (direction === 'down') {
      next.top = rect.bottom + gap
    } else {
      next.bottom = window.innerHeight - rect.top + gap
    }

    if (align === 'left') {
      next.left = rect.left
    } else {
      next.right = window.innerWidth - rect.right
    }

    setPos(next)
  }, [direction, align])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const handler = () => updatePosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = () => setOpen((prev) => !prev)

  const handleSelect = (color: string) => {
    onChange(color)
    setOpen(false)
  }

  const size = swatchSize === 'sm' ? 'w-5 h-5' : 'w-7 h-7'

  const triggerHandler = useMouseDown
    ? { onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); toggle() } }
    : { onClick: toggle }

  const swatchHandler = (color: string) =>
    useMouseDown
      ? { onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); handleSelect(color) } }
      : { onClick: () => handleSelect(color) }

  return (
    <div ref={triggerRef} className="relative">
      <button
        {...triggerHandler}
        className={triggerClassName ?? 'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors'}
      >
        <div
          className={swatchClassName ?? "w-5 h-5 rounded-full border border-gray-200"}
          style={{ backgroundColor: value }}
        />
        {showCaret && <CaretDown size={10} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{ ...pos, minWidth: 140 }}
              className="bg-white rounded-xl border border-gray-200 shadow-xl p-2.5"
            >
              <div className="grid grid-cols-5 gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    {...swatchHandler(c)}
                    className={`${size} rounded-full cursor-pointer hover:scale-110 transition-transform ${
                      value === c ? 'ring-2 ring-offset-1 ring-primary-400' : 'border border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
