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
