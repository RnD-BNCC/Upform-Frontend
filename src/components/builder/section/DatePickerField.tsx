import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function parseIso(v: string): Date | null {
  if (!v) return null
  const d = new Date(v + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function formatDisplay(iso: string) {
  const d = parseIso(iso)
  if (!d) return ''
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

type Props = {
  value?: string
  hasError?: boolean
  onChange: (v: string) => void
  placeholder?: string
}

export default function DatePickerField({
  value,
  hasError = false,
  onChange,
  placeholder,
}: Props) {
  const today = new Date()
  const selected = parseIso(value ?? '')
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const updatePos = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setPopupPos({ top: rect.bottom + 4, left: rect.left })
    }
    updatePos()

    const onDown = (e: MouseEvent) => {
      if (!popupRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', updatePos, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', updatePos, true)
    }
  }, [open])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

  const cells: { day: number; month: 'prev' | 'cur' | 'next' }[] = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrev - firstDay + 1 + i, month: 'prev' })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, month: 'cur' })
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, month: 'next' })

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  const selectDay = (cell: (typeof cells)[0]) => {
    let y = viewYear, m = viewMonth
    if (cell.month === 'prev') { m--; if (m < 0) { m = 11; y-- } }
    if (cell.month === 'next') { m++; if (m > 11) { m = 0; y++ } }
    onChange(toIso(y, m, cell.day))
    setOpen(false)
  }

  const isSelected = (cell: (typeof cells)[0]) => {
    if (!selected || cell.month !== 'cur') return false
    return selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === cell.day
  }

  const isToday = (cell: (typeof cells)[0]) => {
    if (cell.month !== 'cur') return false
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === cell.day
  }

  return (
    <div ref={triggerRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <div
        onClick={() => setOpen(v => !v)}
        className={`theme-answer-input flex w-48 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 bg-white transition-colors ${
          hasError
            ? "border-red-400"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className={`flex-1 ${value ? 'text-sm text-gray-700' : 'theme-answer-placeholder text-xs text-gray-300'}`}>
          {value ? formatDisplay(value) : (placeholder || 'dd/mm/yyyy')}
        </span>
        <CalendarBlankIcon size={14} className="text-gray-400 shrink-0" />
      </div>

      {open && createPortal(
        <div
          ref={popupRef}
          style={{ top: popupPos.top, left: popupPos.left }}
          className="fixed z-[300] bg-white border border-gray-200 rounded-xl shadow-lg w-64 p-3 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <CaretLeftIcon size={12} weight="bold" />
            </button>
            <span className="text-xs font-semibold text-gray-700">{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <CaretRightIcon size={12} weight="bold" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-0.5">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => selectDay(cell)}
                className={`relative h-8 w-full flex items-center justify-center text-xs rounded-lg transition-colors
                  ${isSelected(cell) ? 'theme-primary-button bg-primary-500 text-white font-semibold' : ''}
                  ${!isSelected(cell) && cell.month === 'cur' ? 'text-gray-700 hover:bg-gray-100' : ''}
                  ${cell.month !== 'cur' ? 'text-gray-300 hover:bg-gray-50' : ''}
                `}
              >
                {cell.day}
                {isToday(cell) && !isSelected(cell) && (
                  <span className="theme-primary-button absolute bottom-1 left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-primary-400" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <button onClick={() => { onChange(''); setOpen(false) }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Clear</button>
            <button
              onClick={() => { onChange(toIso(today.getFullYear(), today.getMonth(), today.getDate())); setOpen(false) }}
              className="theme-primary-text text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >Today</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export const dateFieldPlugin = createFieldPlugin({
  type: "date",
  meta: {
    Icon: CalendarBlankIcon,
    iconBg: "bg-purple-100 text-purple-600",
    label: "Date",
    similarTypes: ["time"],
  },
  settings: {
    caption: true,
    defaultValue: true,
    halfWidth: true,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Time",
      label: "Date picker",
      order: 10,
    },
  ],
  createField: createFieldFactory("date", {
    label: "Date",
    required: false,
  }),
  renderBuilder: ({
    field,
    onChange,
    resolvedDefaultValue,
    resolvedPlaceholder,
  }) => (
    <DatePickerField
      value={resolvedDefaultValue || field.defaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
      placeholder={resolvedPlaceholder}
    />
  ),
});
