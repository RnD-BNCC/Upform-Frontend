import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  isOpen: boolean
  onClose?: () => void
  required?: boolean
  zIndex?: string
  className?: string
  duration?: number
  children: ReactNode
}

export default function BaseModal({
  isOpen,
  onClose,
  required,
  zIndex = 'z-[300]',
  className = '',
  duration = 0.15,
  children,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/40 backdrop-blur-sm`}
          onClick={required || !onClose ? undefined : onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration }}
            className={`bg-white rounded-sm shadow-2xl overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
