import { useState, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { SlideType } from '@/types/polling'
import { SLIDE_TYPES } from '@/config/polling'
import { CaretDown } from '@phosphor-icons/react'
import PageMenuDropdown from '@/components/builder/layout/form/PageMenuDropdown'

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
        className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
      >
        <span className="text-primary-500">{selected.icon}</span>
        <span className="flex-1 truncate text-left text-xs font-medium text-gray-700">{selected.label}</span>
        <CaretDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <PageMenuDropdown
            activeId={value}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            options={SLIDE_TYPES.map((type) => ({
              id: type.value,
              label: type.label,
              icon: type.icon,
              iconClassName:
                value === type.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500',
            }))}
            variant="field"
            onSelect={(nextValue) => {
              onChange(nextValue as SlideType)
              setOpen(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
