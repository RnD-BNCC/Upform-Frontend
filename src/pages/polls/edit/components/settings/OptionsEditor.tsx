import { BAR_COLORS_HEX } from '@/config/polling'
import ColorPickerDropdown from '@/components/ui/ColorPickerDropdown'
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
            <ColorPickerDropdown
              value={effectiveColors[i]}
              onChange={(c) => {
                const next = [...effectiveColors]
                next[i] = c
                onColorsChange(next)
                onBlur()
              }}
              colors={BAR_COLORS_HEX}
              direction="down"
              align="left"
              showCaret={false}
              swatchSize="sm"
              triggerClassName="w-6 h-6 rounded-full shrink-0 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold shrink-0">
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
                const nextOpts = options.filter((_, idx) => idx !== i)
                onChange(nextOpts)
                if (onColorsChange) {
                  onColorsChange(effectiveColors.filter((_, idx) => idx !== i))
                }
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
      <button
        onClick={() => {
          onChange([...options, ''])
          if (onColorsChange) {
            onColorsChange([...effectiveColors, BAR_COLORS_HEX[options.length % BAR_COLORS_HEX.length]])
          }
        }}
        className="text-xs text-primary-600 font-bold hover:text-primary-700 self-start mt-1 cursor-pointer flex items-center gap-1"
      >
        <Plus size={12} weight="bold" /> Add option
      </button>
    </div>
  )
}
