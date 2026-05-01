import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { FormEvent } from '@/types/form'
import { DotsThree } from '@phosphor-icons/react'

const STATUS_CONFIG = {
  active: { label: 'Active', dot: 'bg-emerald-400' },
  draft: { label: 'Draft', dot: 'bg-gray-400' },
  closed: { label: 'Closed', dot: 'bg-red-400' },
}

type Props = {
  event: FormEvent
  index: number
  onContextMenu: (id: string, x: number, y: number) => void
}

export default function EventCard({ event, index, onContextMenu }: Props) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[event.status]
  const description = event.description?.trim()

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onContextMenu(event.id, e.clientX, e.clientY)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={() => navigate(`/forms/${event.id}/edit`)}
      onContextMenu={(e) => { e.preventDefault(); openMenu(e) }}
      className="cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-200 group"
    >
      <div className="relative h-32 overflow-hidden" style={{ backgroundColor: '#0054a5' }}>
        {event.image ? (
          <img src={event.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-black/35" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute top-4 -right-4 w-24 h-24 rounded-full bg-black/10" />
            <div className="absolute -bottom-10 left-1/4 w-24 h-24 rounded-full bg-white/5" />
          </>
        )}

        <div className="absolute top-3.5 left-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/95 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <button
          onClick={openMenu}
          className="absolute top-3 right-3 w-7 h-7 rounded-full sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/25 transition-all duration-150 flex items-center justify-center z-10"
          title="More options"
        >
          <DotsThree size={18} weight="bold" className="text-white" />
        </button>

        <div className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 bg-linear-to-t from-black/40 to-transparent">
          <h3 className="text-white font-bold text-sm leading-snug line-clamp-1 drop-shadow-sm" title={event.name}>
            {event.name}
          </h3>
        </div>
      </div>

      {description ? (
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed" title={description}>
            {description}
          </p>
        </div>
      ) : null}

      <div className="px-4 pb-3 pt-1.5 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-gray-800">{event.responseCount}</span>
          <span className="text-[10px] text-gray-400">responses</span>
        </div>
        <span className="text-[10px] text-gray-400">
          {new Date(event.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </motion.div>
  )
}
