import { useState } from 'react'
import { Trash, Plus } from '@phosphor-icons/react'

export default function CorrectAnswersEditor({
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
          <span key={ans} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
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
          className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          placeholder="Type an accepted answer..."
        />
        <button
          onClick={addAnswer}
          disabled={!input.trim()}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}
