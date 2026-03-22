import { motion } from 'framer-motion'
import type { HundredPointsResult } from '@/types/polling'

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

export default function HundredPointsViz({
  data,
  textColor = '#111827',
}: {
  data: HundredPointsResult
  textColor?: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for responses...
      </div>
    )
  }

  const grandTotal = data.reduce((sum, d) => sum + d.totalPoints, 0)
  const maxPoints = Math.max(...data.map((d) => d.totalPoints), 1)

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto p-8">
      {data.map((item, i) => {
        const pct = grandTotal > 0 ? Math.round((item.totalPoints / grandTotal) * 100) : 0
        const barWidth = maxPoints > 0 ? (item.totalPoints / maxPoints) * 100 : 0

        return (
          <div key={`${item.option}-${i}`} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg" style={{ color: textColor }}>
                {item.option || `Option ${i + 1}`}
              </span>
              <span className="font-bold text-lg tabular-nums" style={{ color: textColor, opacity: 0.7 }}>
                {item.totalPoints} pts ({pct}%)
              </span>
            </div>
            <div className="h-10 rounded-lg overflow-hidden" style={{ backgroundColor: `${textColor}0A` }}>
              <motion.div
                className={`h-full rounded-lg ${BAR_COLORS[i % BAR_COLORS.length]} flex items-center justify-end pr-3`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              >
                {item.totalPoints > 0 && (
                  <span className="text-white text-sm font-bold">
                    {item.totalPoints}
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
