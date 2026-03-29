import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SlideType } from '@/types/polling'
import { SLIDE_TYPES } from '@/config/polling'
import { CaretDown } from '@phosphor-icons/react'

export default function TypeDropdown({ value, onChange }: { value: SlideType; onChange: (v: SlideType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = SLIDE_TYPES.find((t) => t.value === value)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white transition-colors cursor-pointer"
      >
        <span className="text-primary-500">{selected.icon}</span>
        <span className="text-xs font-semibold text-gray-800 flex-1 text-left">{selected.label}</span>
        <CaretDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden"
          >
            {SLIDE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { onChange(t.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                  value === t.value ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className={value === t.value ? 'text-primary-500' : 'text-gray-400'}>{t.icon}</span>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
