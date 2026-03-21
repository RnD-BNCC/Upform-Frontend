import { motion } from 'framer-motion'
import type { ScaleResult } from '@/types/polling'

export default function ScaleViz({ data, textColor = '#111827' }: { data: ScaleResult; textColor?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for responses...
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const mean =
    total > 0
      ? data.reduce((sum, d) => sum + d.value * d.count, 0) / total
      : 0

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto p-8">
      <div className="text-center">
        <span className="text-6xl font-black tabular-nums" style={{ color: textColor }}>
          {mean.toFixed(1)}
        </span>
        <p className="text-sm font-medium mt-1" style={{ color: textColor, opacity: 0.5 }}>Average</p>
      </div>

      <div className="flex items-end gap-3 h-48 w-full justify-center">
        {data.map((item) => {
          const height = (item.count / maxCount) * 100

          return (
            <div
              key={item.value}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs font-bold" style={{ color: textColor, opacity: 0.7 }}>
                {item.count}
              </span>
              <motion.div
                className="w-12 bg-blue-500 rounded-t-lg"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
              <span className="font-bold text-sm" style={{ color: textColor }}>
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
