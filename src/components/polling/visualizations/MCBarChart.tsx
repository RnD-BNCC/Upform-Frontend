import { motion, AnimatePresence } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import type { MCResult, SlideSettings } from '@/types/polling'
import { BAR_COLORS_HEX } from '@/config/polling'

export default function MCBarChart({
  data,
  textColor = '#111827',
  settings,
  revealCorrectAnswer,
}: {
  data: MCResult
  textColor?: string
  bgColor?: string
  correctAnswer?: string
  settings?: SlideSettings
  revealCorrectAnswer?: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for votes...
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const isRevealing = !!revealCorrectAnswer

  return (
    <div className="flex items-end justify-center gap-6 w-full max-w-3xl mx-auto px-8 mt-auto pb-6">
      {data.map((item, i) => {
        const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0
        const baseColor = settings?.barColors?.[i] || BAR_COLORS_HEX[i % BAR_COLORS_HEX.length]
        const isCorrect = isRevealing && item.option === revealCorrectAnswer
        const effectiveBarColor = isCorrect ? '#10B981' : baseColor
        const barOpacity = isRevealing && !isCorrect ? 0.3 : 1

        return (
          <div key={`${item.option}-${i}`} className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-full relative h-48">
              {/* Correct badge */}
              <AnimatePresence>
                {isCorrect && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.35 }}
                    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap z-10"
                    style={{ bottom: `calc(${barHeight > 0 ? barHeight : 2}% + 36px)` }}
                  >
                    <Check size={10} weight="bold" /> Correct!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vote count */}
              <span
                className="absolute left-1/2 -translate-x-1/2 font-bold text-2xl tabular-nums"
                style={{
                  color: textColor,
                  opacity: isRevealing && !isCorrect ? 0.35 : 1,
                  bottom: `calc(${barHeight > 0 ? barHeight : 2}% + 4px)`,
                  transition: 'opacity 0.4s ease',
                }}
              >
                {item.count}
              </span>

              {/* Bar */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-xl"
                style={{ width: '70%', backgroundColor: effectiveBarColor, opacity: barOpacity }}
                initial={{ height: 0 }}
                animate={{
                  height: barHeight > 0 ? `${barHeight}%` : '4px',
                  backgroundColor: effectiveBarColor,
                  opacity: barOpacity,
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>

            <div className="mt-3 text-center w-full px-1">
              <span
                className="text-sm font-semibold truncate block"
                style={{
                  color: isCorrect ? '#10B981' : textColor,
                  opacity: isRevealing && !isCorrect ? 0.4 : 1,
                  fontWeight: isCorrect ? 700 : undefined,
                  transition: 'opacity 0.4s ease, color 0.4s ease',
                }}
              >
                {item.option || `Option ${i + 1}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
