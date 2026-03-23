import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SlideType, SlideSettings, ImageLayout } from '@/types/polling'
import { useMutationUploadImage } from '@/api/polls'
import {
  SLIDE_TYPES,
  COLOR_PRESETS,
  THEME_PRESETS,
  IMAGE_LAYOUTS,
  SCALE_COLORS,
} from '@/config/polling'
import type { ThemePreset } from '@/config/polling'
import LayoutIcon from '@/components/ui/LayoutIcon'
import {
  CaretDown,
  Trash,
  Plus,
  Image as ImageIcon,
  Check,
  SpinnerGap,
  PencilSimple,
  DotsSixVertical,
} from '@phosphor-icons/react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
        <CaretDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto"
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

function TypeDropdown({ value, onChange }: { value: SlideType; onChange: (v: SlideType) => void }) {
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

function OptionsEditor({
  options,
  onChange,
  onBlur,
  correctAnswer,
  onCorrectAnswerChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
  onBlur: () => void
  correctAnswer?: string
  onCorrectAnswerChange?: (answer: string | undefined) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold shrink-0">
            {String.fromCharCode(65 + i)}
          </div>
          <input
            value={opt}
            onChange={(e) => {
              const next = [...options]
              const oldVal = next[i]
              next[i] = e.target.value
              onChange(next)
              if (correctAnswer === oldVal && onCorrectAnswerChange) {
                onCorrectAnswerChange(e.target.value)
              }
            }}
            onBlur={onBlur}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
            placeholder={`Option ${i + 1}`}
          />
          {onCorrectAnswerChange && (
            <button
              onClick={() => onCorrectAnswerChange(opt === correctAnswer ? undefined : opt)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                opt && opt === correctAnswer
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
              title={opt === correctAnswer ? 'Remove correct answer' : 'Mark as correct'}
            >
              {opt && opt === correctAnswer && <Check size={12} weight="bold" />}
            </button>
          )}
          {options.length > 1 && (
            <button
              onClick={() => {
                const removed = options[i]
                onChange(options.filter((_, idx) => idx !== i))
                if (correctAnswer === removed && onCorrectAnswerChange) {
                  onCorrectAnswerChange(undefined)
                }
              }}
              className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1"
            >
              <Trash size={14} weight="bold" />
            </button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...options, ''])} className="text-xs text-primary-600 font-bold hover:text-primary-700 self-start mt-1 cursor-pointer flex items-center gap-1">
        <Plus size={12} weight="bold" /> Add option
      </button>
    </div>
  )
}

function CorrectAnswersEditor({
  answers,
  onChange,
  onBlur,
}: {
  answers: string[]
  onChange: (answers: string[]) => void
  onBlur: () => void
}) {
  const [input, setInput] = useState('')

  const addAnswer = () => {
    const trimmed = input.trim()
    if (trimmed && !answers.includes(trimmed)) {
      onChange([...answers, trimmed])
      setInput('')
      onBlur()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {answers.map((ans) => (
          <span key={ans} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-emerald-200">
            {ans}
            <button
              onClick={() => { onChange(answers.filter((a) => a !== ans)); onBlur() }}
              className="text-emerald-400 hover:text-red-500 cursor-pointer"
            >
              <Trash size={10} weight="bold" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addAnswer()}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
          placeholder="Type an accepted answer..."
        />
        <button
          onClick={addAnswer}
          disabled={!input.trim()}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 px-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
      style={{ width: 44, height: 24 }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-transform duration-200"
        style={{ width: 20, height: 20, top: 2, left: 2, transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
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
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors">
        <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: value }} />
        <CaretDown size={10} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 p-3"
            style={{ minWidth: 180 }}
          >
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => { onChange(c); setOpen(false) }}
                  className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${value === c ? 'border-primary-500 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ThemeGrid({ settings, onApply }: { settings: SlideSettings; onApply: (theme: ThemePreset) => void }) {
  const currentThemeId = THEME_PRESETS.find((t) => t.bgColor === settings.bgColor && t.textColor === settings.textColor)?.id

  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_PRESETS.map((theme) => {
        const isActive = theme.id === currentThemeId
        return (
          <button
            key={theme.id}
            onClick={() => onApply(theme)}
            className={`relative flex flex-col rounded-xl border-2 p-2.5 cursor-pointer transition-all hover:scale-[1.02] ${isActive ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="w-full aspect-16/10 rounded-lg flex items-end gap-1 p-2" style={{ backgroundColor: theme.bgColor }}>
              {theme.barColors.map((color, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: color, height: `${40 + i * 20}%` }} />
              ))}
            </div>
            <span className="text-[11px] font-semibold mt-1.5 text-center truncate" style={{ color: isActive ? '#0054a5' : '#6B7280' }}>
              {theme.name}
            </span>
            {isActive && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center">
                <Check size={10} weight="bold" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ImageUpload({
  imageUrl,
  onUpload,
  onRemove,
}: {
  imageUrl?: string
  onUpload: (url: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useMutationUploadImage()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMutation.mutate(file, {
      onSuccess: (data) => onUpload(data.url),
    })
    e.target.value = ''
  }

  if (imageUrl) {
    return (
      <div className="flex flex-col gap-2">
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={imageUrl} alt="" className="w-full h-28 object-cover" />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-primary-600 font-medium flex items-center gap-1 cursor-pointer hover:text-primary-700"
          >
            <PencilSimple size={12} weight="bold" />
            Update image
          </button>
          <button
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-500 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Trash size={12} weight="bold" />
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 transition-colors cursor-pointer"
      >
        {uploadMutation.isPending ? (
          <SpinnerGap size={24} className="text-primary-400 animate-spin mx-auto mb-1.5" />
        ) : (
          <ImageIcon size={24} className="text-gray-300 mx-auto mb-1.5" />
        )}
        <p className="text-xs text-gray-400">
          {uploadMutation.isPending ? 'Uploading...' : (
            <>Drag and drop or <span className="text-primary-500 font-medium">click to add an image</span></>
          )}
        </p>
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">We support png, gif, jpg, jpeg, svg, webp, avif and heif.</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

function LayoutPicker({
  value,
  onChange,
}: {
  value: ImageLayout
  onChange: (layout: ImageLayout) => void
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-2 block">Layout</label>
      <div className="grid grid-cols-3 gap-1.5">
        {IMAGE_LAYOUTS.map((l) => {
          const isActive = value === l.value
          return (
            <button
              key={l.value}
              onClick={() => onChange(l.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LayoutIcon layout={l.value} active={isActive} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SortableStatement({ id, value, color, onChange, onColorChange, onBlur, onDelete, canDelete }: {
  id: string
  value: string
  color: string
  onChange: (val: string) => void
  onColorChange: (color: string) => void
  onBlur: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  const [showColors, setShowColors] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  useEffect(() => {
    if (!showColors) return
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColors(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColors])

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-1.5">
      <div className="relative" ref={colorRef}>
        <button
          onClick={() => setShowColors(!showColors)}
          className="w-5 h-5 rounded-full shrink-0 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-sm"
          style={{ backgroundColor: color }}
        />
        <AnimatePresence>
          {showColors && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-full left-0 mb-1 bg-white rounded-lg border border-gray-200 shadow-xl z-[100] p-1.5"
            >
              <div className="grid grid-cols-5 gap-1">
                {SCALE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { onColorChange(c); setShowColors(false); onBlur() }}
                    className={`w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-primary-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 p-0.5">
        <DotsSixVertical size={14} weight="bold" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
        placeholder="Statement text..."
      />
      {canDelete && (
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1 shrink-0">
          <Trash size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}

function ScaleStatementsEditor({ statements, colors, onChange, onColorsChange, onBlur }: {
  statements: string[]
  colors: string[]
  onChange: (statements: string[]) => void
  onColorsChange: (colors: string[]) => void
  onBlur: () => void
}) {
  const ids = statements.map((_, i) => `stmt-${i}`)
  const effectiveColors = statements.map((_, i) => colors[i] || SCALE_COLORS[i % SCALE_COLORS.length])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    onChange(arrayMove(statements, oldIndex, newIndex))
    onColorsChange(arrayMove(effectiveColors, oldIndex, newIndex))
    onBlur()
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {statements.map((stmt, i) => (
            <SortableStatement
              key={ids[i]}
              id={ids[i]}
              value={stmt}
              color={effectiveColors[i]}
              onChange={(val) => {
                const next = [...statements]
                next[i] = val
                onChange(next)
              }}
              onColorChange={(c) => {
                const next = [...effectiveColors]
                next[i] = c
                onColorsChange(next)
              }}
              onBlur={onBlur}
              onDelete={() => {
                onChange(statements.filter((_, idx) => idx !== i))
                onColorsChange(effectiveColors.filter((_, idx) => idx !== i))
                onBlur()
              }}
              canDelete={statements.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={() => {
          onChange([...statements, ''])
          onColorsChange([...effectiveColors, SCALE_COLORS[statements.length % SCALE_COLORS.length]])
        }}
        className="text-xs text-primary-600 font-bold hover:text-primary-700 self-start mt-1 cursor-pointer flex items-center gap-1"
      >
        <Plus size={12} weight="bold" /> Add statement
      </button>
    </div>
  )
}

export default function SettingsPanel({
  type,
  options,
  settings,
  onTypeChange,
  onOptionsChange,
  onSettingsChange,
  onBlur,
}: {
  type: SlideType
  options: string[]
  settings: SlideSettings
  onTypeChange: (type: SlideType) => void
  onOptionsChange: (options: string[]) => void
  onSettingsChange: (settings: SlideSettings) => void
  onBlur: () => void
}) {
  const needsOptions = ['multiple_choice', 'ranking', 'hundred_points'].includes(type)

  const handleSettingsField = <K extends keyof SlideSettings>(key: K, value: SlideSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const handleApplyTheme = (theme: ThemePreset) => {
    onSettingsChange({ ...settings, bgColor: theme.bgColor, textColor: theme.textColor })
    onBlur()
  }

  return (
    <div className="w-72 bg-white border-l border-gray-100 h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col">
      <div className="px-4 pt-5 pb-3 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide</h3>
      </div>

      <div className="flex flex-col p-4 flex-1">
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Question type</label>
          <TypeDropdown value={type} onChange={onTypeChange} />
        </div>

        {needsOptions && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Answer options</label>
            <OptionsEditor
              options={options}
              onChange={onOptionsChange}
              onBlur={onBlur}
              correctAnswer={type === 'multiple_choice' ? settings.correctAnswer : undefined}
              onCorrectAnswerChange={type === 'multiple_choice' ? (answer) => {
                onSettingsChange({ ...settings, correctAnswer: answer })
                onBlur()
              } : undefined}
            />
          </div>
        )}

        {type === 'open_ended' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Correct answers</label>
            <p className="text-[10px] text-gray-400 mb-2">Add accepted answers for scoring. Leave empty for no scoring.</p>
            <CorrectAnswersEditor
              answers={settings.correctAnswers ?? []}
              onChange={(answers) => onSettingsChange({ ...settings, correctAnswers: answers })}
              onBlur={onBlur}
            />
          </div>
        )}

        {type === 'scales' && (
          <>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Statements</label>
              <p className="text-[10px] text-gray-400 mb-2">Add statements for audience to rate. Drag to reorder.</p>
              <ScaleStatementsEditor
                statements={options}
                colors={settings.scaleColors ?? []}
                onChange={onOptionsChange}
                onColorsChange={(colors) => { onSettingsChange({ ...settings, scaleColors: colors }); onBlur() }}
                onBlur={onBlur}
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Dimensions</label>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 font-medium mb-1 block">Bottom of the scale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.scaleMinLabel ?? ''}
                      onChange={(e) => onSettingsChange({ ...settings, scaleMinLabel: e.target.value || undefined })}
                      onBlur={onBlur}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                      placeholder="Strongly disagree"
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        value={settings.scaleMin ?? 1}
                        onChange={(e) => {
                          const min = Number(e.target.value)
                          const max = settings.scaleMax ?? 10
                          onSettingsChange({ ...settings, scaleMin: min, scaleMax: Math.max(max, min + 1) })
                        }}
                        onBlur={onBlur}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white text-center"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 font-medium mb-1 block">Top of the scale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.scaleMaxLabel ?? ''}
                      onChange={(e) => onSettingsChange({ ...settings, scaleMaxLabel: e.target.value || undefined })}
                      onBlur={onBlur}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                      placeholder="Strongly agree"
                    />
                    <div className="w-16">
                      <input
                        type="number"
                        value={settings.scaleMax ?? 10}
                        onChange={(e) => {
                          const max = Number(e.target.value)
                          const min = settings.scaleMin ?? 1
                          onSettingsChange({ ...settings, scaleMax: Math.max(max, min + 1) })
                        }}
                        onBlur={onBlur}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {type === 'grid_2x2' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Axis labels</label>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">X Axis (horizontal)</label>
                <input
                  type="text"
                  value={settings.axisXLabel ?? ''}
                  onChange={(e) => onSettingsChange({ ...settings, axisXLabel: e.target.value || undefined })}
                  onBlur={onBlur}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                  placeholder="e.g. Effort"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">Y Axis (vertical)</label>
                <input
                  type="text"
                  value={settings.axisYLabel ?? ''}
                  onChange={(e) => onSettingsChange({ ...settings, axisYLabel: e.target.value || undefined })}
                  onBlur={onBlur}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                  placeholder="e.g. Impact"
                />
              </div>
            </div>
          </div>
        )}

        {type === 'pin_on_image' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Background image</label>
            <p className="text-[10px] text-gray-400 mb-2">Upload an image below. Audience members will tap on it to pin their answer.</p>
          </div>
        )}

        {type === 'guess_number' && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Correct number</label>
            <p className="text-[10px] text-gray-400 mb-2">Set the correct answer for scoring.</p>
            <input
              type="number"
              value={settings.correctNumber ?? ''}
              onChange={(e) => onSettingsChange({ ...settings, correctNumber: e.target.value ? Number(e.target.value) : undefined })}
              onBlur={onBlur}
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white mb-3"
              placeholder="Enter the correct number"
            />
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Number range</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">Min</label>
                <input
                  type="number"
                  value={settings.numberMin ?? 0}
                  onChange={(e) => onSettingsChange({ ...settings, numberMin: Number(e.target.value) })}
                  onBlur={onBlur}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 font-medium mb-1 block">Max</label>
                <input
                  type="number"
                  value={settings.numberMax ?? 10}
                  onChange={(e) => onSettingsChange({ ...settings, numberMax: Number(e.target.value) })}
                  onBlur={onBlur}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Image</label>
          <ImageUpload
            imageUrl={settings.imageUrl}
            onUpload={(url) => {
              onSettingsChange({ ...settings, imageUrl: url, imageLayout: settings.imageLayout ?? 'above' })
              onBlur()
            }}
            onRemove={() => {
              onSettingsChange({ ...settings, imageUrl: undefined, imageLayout: undefined })
              onBlur()
            }}
          />
        </div>

        {settings.imageUrl && (
          <div className="mb-5">
            <LayoutPicker
              value={settings.imageLayout ?? 'above'}
              onChange={(layout) => {
                handleSettingsField('imageLayout', layout)
                onBlur()
              }}
            />
          </div>
        )}

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Default themes</h4>
          <ThemeGrid settings={settings} onApply={handleApplyTheme} />
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Text</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Visualization text color</span>
            <ColorPicker value={settings.textColor ?? '#374151'} onChange={(c) => { handleSettingsField('textColor', c); onBlur() }} />
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Background</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Background color</span>
              <ColorPicker value={settings.bgColor ?? '#F3F4F6'} onChange={(c) => { handleSettingsField('bgColor', c); onBlur() }} />
            </div>
            <button
              onClick={() => { onSettingsChange({ ...settings, textColor: undefined, bgColor: undefined }); onBlur() }}
              className="text-xs text-primary-400 font-medium self-start mt-1 cursor-pointer hover:text-primary-500 transition-colors"
            >
              Reset to theme defaults
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 my-1" />

        <div className="py-4">
          <h4 className="text-xs font-bold text-gray-700 mb-3">Joining instructions</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Display QR code</span>
              <Toggle checked={settings.showQrCode !== false} onChange={(v) => { handleSettingsField('showQrCode', v); onBlur() }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-medium">Display instructions bar</span>
              <Toggle checked={settings.showInstructionsBar !== false} onChange={(v) => { handleSettingsField('showInstructionsBar', v); onBlur() }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
