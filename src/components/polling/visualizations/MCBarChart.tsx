import { motion } from 'framer-motion'
import { CheckCircle } from '@phosphor-icons/react'
import type { MCResult } from '@/types/polling'

const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
]

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

export default function MCBarChart({
  data,
  textColor = '#111827',
  bgColor = '#FFFFFF',
  correctAnswer,
}: {
  data: MCResult
  textColor?: string
  bgColor?: string
  correctAnswer?: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for votes...
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const dark = isColorDark(bgColor)

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto p-8">
      {data.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0
        const isCorrect = correctAnswer !== undefined && item.option === correctAnswer

        return (
          <div key={`${item.option}-${i}`} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg flex items-center gap-2" style={{ color: textColor }}>
                {isCorrect && <CheckCircle size={20} className="text-emerald-500" weight="fill" />}
                {item.option || `Option ${i + 1}`}
              </span>
              <span className="font-bold text-lg tabular-nums" style={{ color: textColor, opacity: 0.7 }}>
                {pct}%
              </span>
            </div>
            <div
              className="h-10 rounded-lg overflow-hidden"
              style={{ backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)' }}
            >
              <motion.div
                className={`h-full rounded-lg ${isCorrect ? 'bg-emerald-500' : BAR_COLORS[i % BAR_COLORS.length]} flex items-center justify-end pr-3`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              >
                {item.count > 0 && (
                  <span className="text-white text-sm font-bold">
                    {item.count}
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
