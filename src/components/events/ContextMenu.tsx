import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowSquareOut,
  Trash,
  CheckCircle,
  XCircle,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import type { FormEvent } from '@/types/form'

type Props = {
  x: number
  y: number
  event: FormEvent
  onClose: () => void
  onOpen: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

const PUBLISH_ACTIONS: Record<FormEvent['status'], { label: string; Icon: Icon }> = {
  active: { label: 'Unpublish', Icon: XCircle },
  draft: { label: 'Publish', Icon: CheckCircle },
  closed: { label: 'Reopen', Icon: ArrowCounterClockwise },
}

export default function ContextMenu({
  x,
  y,
  event,
  onClose,
  onOpen,
  onDelete,
  onToggleStatus,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { label: publishLabel, Icon: PublishIcon } = PUBLISH_ACTIONS[event.status]

  const adjustedX = Math.min(x, window.innerWidth - 204)
  const adjustedY = Math.min(y, window.innerHeight - 190)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.08, ease: 'easeOut' }}
      className="fixed z-[100] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100/80 w-48 select-none overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
          Form
        </p>
        <p className="text-xs font-semibold text-gray-800 truncate" title={event.name}>{event.name}</p>
      </div>

      <div className="h-px bg-gray-100 mx-2" />

      {/* Main actions */}
      <div className="p-1.5 space-y-0.5">
        <button
          onClick={onOpen}
          className="group w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left rounded-lg"
        >
          <ArrowSquareOut
            size={14}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          Open
        </button>

        <button
          onClick={onToggleStatus}
          className="group w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left rounded-lg"
        >
          <PublishIcon
            size={14}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          {publishLabel}
        </button>
      </div>

      <div className="h-px bg-gray-100 mx-2" />

      {/* Danger */}
      <div className="p-1.5">
        <button
          onClick={onDelete}
          className="group w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 hover:font-bold active:bg-red-100 transition-colors text-left rounded-lg"
        >
          <Trash
            size={14}
            className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
          />
          Delete
        </button>
      </div>
    </motion.div>
  )
}
