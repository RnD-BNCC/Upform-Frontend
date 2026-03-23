import { motion, AnimatePresence } from 'framer-motion'
import type { OpenEndedResult } from '@/types/polling'
import { OPEN_ENDED_COLORS as COLORS } from '@/config/polling'

export default function OpenEndedFeed({ data, textColor = '#111827' }: { data: OpenEndedResult; textColor?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for responses...
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-3xl mx-auto p-8">
      <AnimatePresence>
        {data.map((item, i) => {
          const ratio = item.count / maxCount
          const fontSize = 16 + ratio * 32
          const color = COLORS[i % COLORS.length]

          return (
            <motion.span
              key={item.text}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="font-extrabold select-none"
              style={{ fontSize, color }}
            >
              {item.text}
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
