import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { XIcon } from '@phosphor-icons/react'

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi', '.mkv']

function getMediaType(url: string): 'image' | 'video' | null {
  const lower = url.toLowerCase().split('?')[0]
  if (IMAGE_EXTS.some((ext) => lower.endsWith(ext))) return 'image'
  if (VIDEO_EXTS.some((ext) => lower.endsWith(ext))) return 'video'
  return null
}

interface FilePreviewModalProps {
  url: string
  name: string
  onClose: () => void
}

export default function FilePreviewModal({ url, name, onClose }: FilePreviewModalProps) {
  const mediaType = getMediaType(url)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!mediaType) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
      >
        <XIcon size={20} weight="bold" className="text-white" />
      </button>

      <div onClick={(e) => e.stopPropagation()}>
        {mediaType === 'image' && (
          <img
            src={url}
            alt={name}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
          />
        )}
        {mediaType === 'video' && (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-[90vw] rounded-lg"
          >
            <track kind="captions" />
          </video>
        )}
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm truncate max-w-[80vw]">
        {name}
      </p>
    </motion.div>
  )
}
