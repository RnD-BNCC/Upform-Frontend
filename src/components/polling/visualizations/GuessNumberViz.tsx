import { motion } from 'framer-motion'
import type { GuessNumberResult } from '@/types/polling'

export default function GuessNumberViz({
  data,
  textColor = '#111827',
  correctNumber,
}: {
  data: GuessNumberResult
  textColor?: string
  correctNumber?: number
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for guesses...
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const mean = total > 0 ? data.reduce((sum, d) => sum + d.value * d.count, 0) / total : 0

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto p-8">
      <div className="flex items-center gap-8">
        {correctNumber !== undefined && (
          <div className="text-center">
            <span className="text-5xl font-black tabular-nums text-emerald-500">
              {correctNumber}
            </span>
            <p className="text-sm font-medium mt-1" style={{ color: textColor, opacity: 0.5 }}>Correct</p>
          </div>
        )}
        <div className="text-center">
          <span className="text-5xl font-black tabular-nums" style={{ color: textColor }}>
            {mean.toFixed(1)}
          </span>
          <p className="text-sm font-medium mt-1" style={{ color: textColor, opacity: 0.5 }}>Average guess</p>
        </div>
        <div className="text-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color: textColor, opacity: 0.6 }}>
            {total}
          </span>
          <p className="text-sm font-medium mt-1" style={{ color: textColor, opacity: 0.5 }}>Guesses</p>
        </div>
      </div>

      <div className="flex items-end gap-2 h-48 w-full justify-center flex-wrap">
        {data.map((item) => {
          const height = (item.count / maxCount) * 100
          const isCorrect = correctNumber !== undefined && item.value === correctNumber

          return (
            <div key={item.value} className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold" style={{ color: textColor, opacity: 0.7 }}>
                {item.count}
              </span>
              <motion.div
                className={`w-10 rounded-t-lg ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
              <span
                className={`font-bold text-xs ${isCorrect ? 'text-emerald-500' : ''}`}
                style={isCorrect ? undefined : { color: textColor }}
              >
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
