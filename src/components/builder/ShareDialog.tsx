import { useState } from 'react'
import { motion } from 'framer-motion'
import { CopyIcon, CheckIcon, ArrowSquareOutIcon, XIcon } from '@phosphor-icons/react'

type ShareDialogProps = {
  url: string
  onClose: () => void
}

export default function ShareDialog({ url, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Share your form</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Anyone with this link can fill out your form.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 outline-none select-all"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors shrink-0"
          >
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={() => window.open(url, '_blank')}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          <ArrowSquareOutIcon size={13} />
          Open form in new tab
        </button>
      </motion.div>
    </motion.div>
  )
}
