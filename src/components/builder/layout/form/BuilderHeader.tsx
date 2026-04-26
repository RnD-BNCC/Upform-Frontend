import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  HouseIcon,
  CaretDownIcon,
  EyeIcon,
  RocketLaunchIcon,
  ProhibitIcon,
  LockIcon,
} from '@phosphor-icons/react'
import { Spinner } from '@/components/ui'

type Tab = 'questions' | 'share' | 'responses'

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
  onUnpublish?: () => void
  onClose?: () => void
}

const NAV_TABS: { key: Tab; label: string }[] = [
  { key: 'questions', label: 'Edit' },
  { key: 'share', label: 'Share' },
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
  onUnpublish,
  onClose,
}: BuilderHeaderProps) {
  const [titleEditing, setTitleEditing] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (titleEditing) titleRef.current?.select()
  }, [titleEditing])

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

        <div className="flex flex-col items-start min-w-0">
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
          {isDirty && (
            <span className="text-[10px] font-medium pointer-events-none whitespace-nowrap leading-none -mt-0.5">
              {isSaving ? (
                <span className="flex items-center gap-1 text-primary-500">
                  <Spinner size={9} />
                  Saving…
                </span>
              ) : (
                <span className="text-amber-500">● Unsaved</span>
              )}
            </span>
          )}
        </div>
      </div>

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

        {/* Actions for active forms */}
        {eventStatus === 'active' && onUnpublish && (
          <button
            onClick={onUnpublish}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <ProhibitIcon size={14} />
            Unpublish
          </button>
        )}
        {eventStatus === 'active' && onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LockIcon size={14} />
            Close form
          </button>
        )}

        {/* Publish CTA */}
        {(eventStatus === 'draft' || eventStatus === 'closed') && onPublish && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing
              ? <Spinner size={13} />
              : <RocketLaunchIcon size={13} />
            }
            {isPublishing ? 'Publishing...' : eventStatus === 'closed' ? 'Reopen' : 'Publish'}
          </motion.button>
        )}
      </div>
    </header>
  )
}
