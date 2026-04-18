import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HouseIcon,
  CaretDownIcon,
  EyeIcon,
  RocketLaunchIcon,
  SpinnerGapIcon,
  ShareNetworkIcon,
  ProhibitIcon,
  LockIcon,
  DotsThreeVerticalIcon,
} from '@phosphor-icons/react'

type Tab = 'questions' | 'responses'

type BuilderHeaderProps = {
  formTitle: string
  onTitleChange: (v: string) => void
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onBack: () => void
  onPreview: () => void
  isSaving?: boolean
  isDirty?: boolean
  eventStatus?: 'draft' | 'active' | 'closed'
  onPublish?: () => void
  isPublishing?: boolean
  onShare?: () => void
  onUnpublish?: () => void
  onClose?: () => void
}

const NAV_TABS: { key: Tab; label: string }[] = [
  { key: 'questions', label: 'Edit' },
  { key: 'responses', label: 'Results' },
]

export default function BuilderHeader({
  formTitle,
  onTitleChange,
  activeTab,
  onTabChange,
  onBack,
  onPreview,
  isSaving,
  isDirty,
  eventStatus,
  onPublish,
  isPublishing,
  onShare,
  onUnpublish,
  onClose,
}: BuilderHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [titleEditing, setTitleEditing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (titleEditing) titleRef.current?.select()
  }, [titleEditing])

  const showOverflow = eventStatus === 'active' && (onUnpublish || onClose)

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shrink-0 z-30 relative">
      {/* Left: home + form name */}
      <div className="flex items-center gap-1 shrink-0 w-52 min-w-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          title="Home"
        >
          <HouseIcon size={16} weight="fill" />
        </button>

        <div className="flex items-center gap-1 min-w-0">
          {titleEditing ? (
            <input
              ref={titleRef}
              type="text"
              value={formTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setTitleEditing(false) }}
              className="text-sm font-semibold text-gray-900 outline-none border-b-2 border-primary-400 bg-transparent min-w-0 max-w-[200px]"
              maxLength={80}
            />
          ) : (
            <button
              onClick={() => setTitleEditing(true)}
              className="text-sm font-semibold text-gray-800 hover:text-gray-900 truncate max-w-[200px] flex items-center gap-1"
            >
              <span className="truncate">{formTitle || 'Untitled Form'}</span>
              <CaretDownIcon size={12} className="text-gray-400 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Save indicator — absolute so it doesn't push center tabs */}
      {isDirty && (
        <span className="absolute left-9 bottom-1 text-[9px] text-gray-400 font-medium pointer-events-none whitespace-nowrap">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <SpinnerGapIcon size={10} className="animate-spin" />
              Saving
            </span>
          ) : '● Unsaved'}
        </span>
      )}

      {/* Center: nav tabs */}
      <div className="flex-1 flex items-center justify-center">
        <nav className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {NAV_TABS.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <EyeIcon size={14} />
          Preview
        </button>

        {/* Overflow menu for active forms */}
        {showOverflow && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <DotsThreeVerticalIcon size={15} weight="bold" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 py-1.5 z-50"
                >
                  {onUnpublish && (
                    <button
                      onClick={() => { setMenuOpen(false); onUnpublish() }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <ProhibitIcon size={14} />
                      Unpublish
                    </button>
                  )}
                  {onClose && (
                    <button
                      onClick={() => { setMenuOpen(false); onClose() }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LockIcon size={14} />
                      Close form
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Publish / Share CTA */}
        {(eventStatus === 'draft' || eventStatus === 'closed') && onPublish && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing
              ? <SpinnerGapIcon size={13} className="animate-spin" />
              : <RocketLaunchIcon size={13} />
            }
            {isPublishing ? 'Publishing...' : eventStatus === 'closed' ? 'Reopen' : 'Publish'}
          </motion.button>
        )}
        {eventStatus === 'active' && onShare && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onShare}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <ShareNetworkIcon size={13} />
            Share
          </motion.button>
        )}
      </div>
    </header>
  )
}
