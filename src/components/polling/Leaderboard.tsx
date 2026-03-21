import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, X } from '@phosphor-icons/react'
import type { LeaderboardEntry } from '@/types/polling'

const RANK_COLORS = [
  'from-amber-400 to-yellow-500',   // #1 gold
  'from-gray-300 to-gray-400',      // #2 silver
  'from-amber-600 to-amber-700',    // #3 bronze
  'from-primary-400 to-primary-500', // #4
  'from-primary-300 to-primary-400', // #5
]

const BAR_BG = [
  'bg-amber-400/20',
  'bg-gray-300/20',
  'bg-amber-600/20',
  'bg-primary-400/15',
  'bg-primary-300/15',
]

export default function Leaderboard({
  scores,
  onClose,
}: {
  scores: LeaderboardEntry[]
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'runners' | 'winner'>('runners')
  const top5 = scores.slice(0, 5)
  const runners = top5.slice(1).reverse() // #5, #4, #3, #2

  useEffect(() => {
    const timer = setTimeout(() => setPhase('winner'), runners.length * 1000 + 1500)
    return () => clearTimeout(timer)
  }, [runners.length])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 flex flex-col items-center justify-center overflow-hidden"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/30 hover:text-white/60 cursor-pointer transition-colors z-10"
      >
        <X size={24} weight="bold" />
      </button>

      <AnimatePresence mode="wait">
        {phase === 'runners' && (
          <motion.div
            key="runners"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            className="w-full max-w-2xl px-4 sm:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 sm:mb-10"
            >
              <Trophy size={32} className="text-amber-400 mx-auto mb-2 sm:mb-3" weight="fill" />
              <h2 className="text-xl sm:text-2xl font-black text-white">Leaderboard</h2>
            </motion.div>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              {runners.map((entry, i) => {
                const rank = top5.indexOf(entry) + 1
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.8, type: 'spring', stiffness: 80, damping: 15 }}
                    className={`flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl px-3 py-3 sm:px-5 sm:py-4 ${BAR_BG[rank - 1]}`}
                  >
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${RANK_COLORS[rank - 1]} flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-lg shrink-0`}>
                      {rank}
                    </div>
                    <img
                      src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${entry.avatarSeed || entry.id}`}
                      alt={entry.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 shrink-0"
                    />
                    <span className="flex-1 text-white font-bold text-base sm:text-lg truncate min-w-0">
                      {entry.name}
                    </span>
                    <span className="text-white/80 font-black text-base sm:text-lg tabular-nums shrink-0">
                      {entry.score} p
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {phase === 'winner' && top5[0] && (
          <motion.div
            key="winner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 sm:gap-6 px-4 sm:px-8"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-black text-white"
            >
              And the winner is...
            </motion.h2>

            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100, damping: 12 }}
              className="relative"
            >
              <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 z-10">
                <Crown size={36} className="text-amber-400 sm:hidden" weight="fill" />
                <Crown size={48} className="text-amber-400 hidden sm:block" weight="fill" />
              </div>
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${top5[0].avatarSeed || top5[0].id}`}
                alt={top5[0].name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/10 border-3 sm:border-4 border-amber-400 shadow-2xl shadow-amber-400/30"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-center"
            >
              <h3 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2">
                {top5[0].name}
              </h3>
              <p className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
                {top5[0].score} points
              </p>
            </motion.div>

            {/* Other participants below */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-2 sm:mt-4"
            >
              {top5.slice(1, 4).map((entry) => (
                <div key={entry.id} className="flex flex-col items-center gap-1 sm:gap-1.5 opacity-60">
                  <img
                    src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${entry.avatarSeed || entry.id}`}
                    alt={entry.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10"
                  />
                  <span className="text-white text-xs font-semibold truncate max-w-14 sm:max-w-16">
                    {entry.name}
                  </span>
                  <span className="text-white/50 text-xs font-bold tabular-nums">
                    {entry.score} p
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
