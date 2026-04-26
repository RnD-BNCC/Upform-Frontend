import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  message: string | null
  icon: ReactNode
  bottom?: string
}

export default function ActionToast({ message, icon, bottom = 'bottom-20' }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`fixed ${bottom} left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg`}
        >
          {icon}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
