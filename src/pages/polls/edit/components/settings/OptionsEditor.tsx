import { BAR_COLORS_HEX } from '@/config/polling'
import { ColorInputField } from '@/components/ui'
import { Trash, Plus, Check } from '@phosphor-icons/react'

export default function OptionsEditor({
  options,
  onChange,
  onBlur,
  correctAnswer,
  onCorrectAnswerChange,
  colors,
  onColorsChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
  onBlur: () => void
  correctAnswer?: string
  onCorrectAnswerChange?: (answer: string | undefined) => void
  colors?: string[]
  onColorsChange?: (colors: string[]) => void
}) {
  const effectiveColors = options.map((_, i) => colors?.[i] || BAR_COLORS_HEX[i % BAR_COLORS_HEX.length])

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          {onColorsChange ? (
            <ColorInputField
              value={effectiveColors[i]}
              onChange={(c) => {
                const next = [...effectiveColors]
                next[i] = c
                onColorsChange(next)
                onBlur()
              }}
            />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-100 text-[10px] font-bold text-primary-600">
              {String.fromCharCode(65 + i)}
            </div>
          )}
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
            className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
            placeholder={`Option ${i + 1}`}
          />
          {onCorrectAnswerChange && (
            <button
              onClick={() => onCorrectAnswerChange(opt === correctAnswer ? undefined : opt)}
              className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors ${
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
                const nextOpts = options.filter((_, idx) => idx !== i)
                onChange(nextOpts)
                if (onColorsChange) {
                  onColorsChange(effectiveColors.filter((_, idx) => idx !== i))
                }
                if (correctAnswer === removed && onCorrectAnswerChange) {
                  onCorrectAnswerChange(undefined)
                }
              }}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash size={14} weight="bold" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => {
          onChange([...options, ''])
          if (onColorsChange) {
            onColorsChange([...effectiveColors, BAR_COLORS_HEX[options.length % BAR_COLORS_HEX.length]])
          }
        }}
        className="mt-1 flex cursor-pointer items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
      >
        <Plus size={12} weight="bold" /> Add option
      </button>
    </div>
  )
}
