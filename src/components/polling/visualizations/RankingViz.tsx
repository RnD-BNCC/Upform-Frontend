import { motion } from 'framer-motion'
import type { RankingResult } from '@/types/polling'

export default function RankingViz({ data, textColor = '#111827' }: { data: RankingResult; textColor?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for rankings...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-8">
      {data.map((item, i) => (
        <motion.div
          key={item.option}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-4 rounded-xl px-5 py-4 border"
          style={{ backgroundColor: `${textColor}10`, borderColor: `${textColor}15` }}
        >
          <span className="text-3xl font-black w-10 text-center" style={{ color: textColor, opacity: 0.3 }}>
            {i + 1}
          </span>
          <span className="font-semibold text-lg flex-1" style={{ color: textColor }}>
            {item.option}
          </span>
          <span className="font-medium text-sm" style={{ color: textColor, opacity: 0.5 }}>
            Avg rank: {item.avgRank.toFixed(1)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
