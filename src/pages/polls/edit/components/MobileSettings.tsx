import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown, Plus, Trash } from '@phosphor-icons/react'
import { SLIDE_TYPES, TYPE_ICONS } from '@/config/polling'
import type { MobileSettingsProps } from './types'

function NumberDropdown({ value, options, onChange }: { value: number; options: number[]; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors cursor-pointer"
      >
        <span className="text-xs font-semibold text-gray-800">{value}</span>
        <CaretDown size={11} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden max-h-40 overflow-y-auto"
          >
            {options.map((n) => (
              <button
                key={n}
                onClick={() => { onChange(n); setOpen(false) }}
                className={`w-full px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  value === n ? 'bg-primary-50 text-primary-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default function MobileSettings({
  type,
  options,
  settings,
  onTypeChange,
  onOptionsChange,
  onSettingsChange,
  onBlur,
}: MobileSettingsProps) {
  const needsOptions = ['multiple_choice', 'ranking', 'hundred_points'].includes(type)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Question type</label>
        <div className="flex flex-wrap gap-1.5">
          {SLIDE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                type === t.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {TYPE_ICONS[t.value]}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Answer options</label>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </div>
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options]; next[i] = e.target.value; onOptionsChange(next)
                  }}
                  onBlur={onBlur}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
                  placeholder={`Option ${i + 1}`}
                />
                {options.length > 1 && (
                  <button onClick={() => onOptionsChange(options.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 cursor-pointer p-0.5">
                    <Trash size={12} weight="bold" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => onOptionsChange([...options, ''])}
              className="text-xs text-primary-600 font-bold self-start cursor-pointer flex items-center gap-1"
            >
              <Plus size={10} weight="bold" />
              Add option
            </button>
          </div>
        </div>
      )}

      {type === 'scales' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Scale Range</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Min</label>
              <NumberDropdown
                value={settings.maxSelections ?? 1}
                options={Array.from({ length: 10 }, (_, i) => i)}
                onChange={(min) => { onSettingsChange({ ...settings, maxSelections: min, maxWords: Math.max(settings.maxWords ?? 10, min + 1) }); onBlur() }}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Max</label>
              <NumberDropdown
                value={settings.maxWords ?? 10}
                options={Array.from({ length: 10 - (settings.maxSelections ?? 1) }, (_, i) => (settings.maxSelections ?? 1) + 1 + i)}
                onChange={(max) => { onSettingsChange({ ...settings, maxWords: max }); onBlur() }}
              />
            </div>
          </div>
        </div>
      )}

      {type === 'guess_number' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Correct number</label>
          <input
            type="number"
            value={settings.correctNumber ?? ''}
            onChange={(e) => onSettingsChange({ ...settings, correctNumber: e.target.value ? Number(e.target.value) : undefined })}
            onBlur={onBlur}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white mb-3"
            placeholder="Enter the correct number"
          />
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Number range</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Min</label>
              <input
                type="number"
                value={settings.numberMin ?? 1}
                onChange={(e) => onSettingsChange({ ...settings, numberMin: Number(e.target.value) })}
                onBlur={onBlur}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Max</label>
              <input
                type="number"
                value={settings.numberMax ?? 100}
                onChange={(e) => onSettingsChange({ ...settings, numberMax: Number(e.target.value) })}
                onBlur={onBlur}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
