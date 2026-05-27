import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlobeHemisphereWest, LockIcon } from '@phosphor-icons/react'
import BaseModal from '@/components/ui/BaseModal'
import Spinner from '@/components/ui/Spinner'
import type { ResourceVisibility } from '@/types/api'

type Props = {
  isOpen: boolean
  onClose?: () => void
  onCreate: (name: string, visibility?: ResourceVisibility) => Promise<void>
  isLoading?: boolean
  required?: boolean
  defaultName?: string
  defaultVisibility?: ResourceVisibility
  showVisibilitySelect?: boolean
  title?: string
}

export default function RenameModal({
  isOpen,
  onClose,
  onCreate,
  isLoading,
  required,
  defaultName = 'My form',
  defaultVisibility = 'private',
  showVisibilitySelect,
  title = 'Rename',
}: Props) {
  const [name, setName] = useState(defaultName)
  const [visibility, setVisibility] =
    useState<ResourceVisibility>(defaultVisibility)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => {
      setName(defaultName)
      setVisibility(defaultVisibility)
      inputRef.current?.select()
    }, 100)
    return () => window.clearTimeout(timer)
  }, [isOpen, defaultName, defaultVisibility])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isLoading) return
    await onCreate(name.trim(), showVisibilitySelect ? visibility : undefined)
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} required={required} className="w-full max-w-md mx-4">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-bold text-gray-900 mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-primary-400 rounded-sm px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-300"
            maxLength={80}
            autoComplete="off"
          />
          {showVisibilitySelect ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-gray-500">Access</p>
              <div className="grid grid-cols-2 gap-2">
                {(['private', 'public'] as const).map((option) => {
                  const active = visibility === option
                  const Icon = option === 'private' ? LockIcon : GlobeHemisphereWest
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVisibility(option)}
                      className={`flex h-10 items-center justify-center gap-2 rounded-sm border px-3 text-sm font-semibold capitalize transition-colors ${
                        active
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-500 hover:border-primary-200 hover:bg-primary-50'
                      }`}
                    >
                      <Icon size={16} weight={active ? 'fill' : 'bold'} />
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </form>
      </div>
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
        {!required && onClose && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={isLoading || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Spinner />}
          Continue
        </motion.button>
      </div>
    </BaseModal>
  )
}
