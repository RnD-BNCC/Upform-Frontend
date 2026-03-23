import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetPollDetail } from '@/hooks/polls'
import {
  useMutationUpdatePoll,
  useMutationCreateSlide,
  useMutationUpdateSlide,
  useMutationDeleteSlide,
} from '@/api/polls'
import { ConfirmModal, LoadingModal, StatusModal } from '@/components/ui'
import type { StatusType } from '@/components/ui/StatusModal'
import type { PollSlide, SlideType, SlideSettings } from '@/types/polling'
import SlidePreview from './components/SlidePreview'
import SettingsPanel from './components/SettingsPanel'
import { SLIDE_TYPES, TYPE_ICONS } from '@/config/polling'
import {
  ArrowLeft,
  CaretDown,
  Plus,
  Trash,
  Presentation,
  SpinnerGap,
  Copy,
  FloppyDisk,
} from '@phosphor-icons/react'

function NumberDropdown({ value, options, onChange }: { value: number; options: number[]; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors cursor-pointer"
      >
        <span className="text-xs font-semibold text-gray-800">{value}</span>
        <CaretDown size={11} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden max-h-40 overflow-y-auto"
          >
            {options.map((n) => (
              <button
                key={n}
                onClick={() => { onChange(n); setOpen(false) }}
                className={`w-full px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  value === n ? 'bg-primary-50 text-primary-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function useSlideState(slide: PollSlide, pollId: string, onSaved?: () => void) {
  const updateSlide = useMutationUpdateSlide(pollId)

  const [question, setQuestionState] = useState(slide.question)
  const [type, setTypeState] = useState<SlideType>(slide.type as SlideType)
  const [options, setOptionsState] = useState<string[]>(slide.options ?? [])
  const [settings, setSettingsState] = useState<SlideSettings>(
    (slide.settings as SlideSettings) ?? {},
  )

  const pendingRef = useRef({ question, type, options, settings })

  useEffect(() => {
    const q = slide.question
    const t = slide.type as SlideType
    const o = slide.options ?? []
    const s = (slide.settings as SlideSettings) ?? {}
    pendingRef.current = { question: q, type: t, options: o, settings: s }
    setQuestionState(q)
    setTypeState(t)
    setOptionsState(o)
    setSettingsState(s)
  }, [slide.id])

  const setQuestion = useCallback((q: string) => {
    pendingRef.current.question = q
    setQuestionState(q)
  }, [])

  const setOptions = useCallback((o: string[]) => {
    pendingRef.current.options = o
    setOptionsState(o)
  }, [])

  const setSettings = useCallback((s: SlideSettings) => {
    pendingRef.current.settings = s
    setSettingsState(s)
  }, [])

  const doSave = useCallback(
    (overrides?: Partial<{ question: string; type: SlideType; options: string[]; settings: SlideSettings }>) => {
      updateSlide.mutate(
        {
          slideId: slide.id,
          question: overrides?.question ?? pendingRef.current.question,
          type: overrides?.type ?? pendingRef.current.type,
          options: overrides?.options ?? pendingRef.current.options,
          settings: overrides?.settings ?? pendingRef.current.settings,
        },
        { onSuccess: () => onSaved?.() },
      )
    },
    [slide.id, updateSlide, onSaved],
  )

  const handleTypeChange = (newType: SlideType) => {
    pendingRef.current.type = newType
    setTypeState(newType)
    doSave({ type: newType })
  }

  return {
    question, setQuestion,
    type, setType: handleTypeChange,
    options, setOptions,
    settings, setSettings,
    doSave,
  }
}

export default function PollEditPage() {
  const { id: pollId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: poll, isLoading } = useGetPollDetail(pollId ?? '')
  const updatePoll = useMutationUpdatePoll()
  const createSlide = useMutationCreateSlide(pollId ?? '')
  const deleteSlide = useMutationDeleteSlide(pollId ?? '')

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [titleInit, setTitleInit] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [liveQuestion, setLiveQuestion] = useState<string | null>(null)
  const slideSaveRef = useRef<(() => void) | null>(null)

  const showToast = useCallback((msg = 'Saved successfully') => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (pollId && title) updatePoll.mutate({ pollId, title })
        slideSaveRef.current?.()
        showToast()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pollId, title, updatePoll, showToast])

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void
  }>({ open: false, title: '', description: '', onConfirm: () => {} })
  const [loadingModal, setLoadingModal] = useState(false)
  const [statusModal, setStatusModal] = useState<{
    open: boolean; type: StatusType; title: string; description: string
  }>({ open: false, type: 'success', title: '', description: '' })

  useEffect(() => {
    if (poll && !titleInit) {
      setTitle(poll.title)
      setTitleInit(true)
    }
  }, [poll, titleInit])

  if (isLoading || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SpinnerGap size={32} className="text-primary-500 animate-spin" />
      </div>
    )
  }

  const slides = poll.slides
  const selectedSlide = slides[selectedIndex]

  const handleSaveTitle = () => {
    if (!pollId) return
    updatePoll.mutate({ pollId, title })
  }

  const handleAddSlide = () => {
    setLoadingModal(true)
    createSlide.mutate(
      {},
      {
        onSuccess: () => {
          setLoadingModal(false)
          setSelectedIndex(slides.length)
          setStatusModal({ open: true, type: 'success', title: 'Slide Added', description: 'New slide has been created successfully.' })
        },
        onError: () => {
          setLoadingModal(false)
          setStatusModal({ open: true, type: 'error', title: 'Failed', description: 'Could not create slide. Please try again.' })
        },
      },
    )
  }

  const handleDeleteSlide = (slideId: string) => {
    setConfirmModal({
      open: true,
      title: 'Delete Slide',
      description: 'Are you sure you want to delete this slide? This action cannot be undone.',
      onConfirm: () => {
        setConfirmModal((s) => ({ ...s, open: false }))
        setLoadingModal(true)
        deleteSlide.mutate(slideId, {
          onSuccess: () => {
            setLoadingModal(false)
            if (selectedIndex >= slides.length - 1) setSelectedIndex(Math.max(0, slides.length - 2))
            setStatusModal({ open: true, type: 'success', title: 'Deleted', description: 'Slide has been removed successfully.' })
          },
          onError: () => {
            setLoadingModal(false)
            setStatusModal({ open: true, type: 'error', title: 'Failed', description: 'Could not delete slide. Please try again.' })
          },
        })
      },
    })
  }

  const copyCode = () => navigator.clipboard.writeText(poll.code)

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col sm:flex-row"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <header className="sm:hidden fixed top-0 left-0 right-0 bg-primary-800 z-50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/polls')} className="text-white/60 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={18} weight="bold" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          placeholder="Poll title..."
          className="text-sm font-semibold text-white bg-transparent outline-none flex-1 placeholder:text-white/40"
        />
        <button
          onClick={() => navigate(`/polls/${pollId}/present`)}
          className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <Presentation size={12} weight="bold" />
          Present
        </button>
      </header>

      <div className="sm:hidden fixed top-14 left-0 right-0 z-40 flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 overflow-x-auto">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setSelectedIndex(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedIndex === i ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}
            <span className="max-w-20 truncate">
              {slide.question || SLIDE_TYPES.find((t) => t.value === slide.type)?.label}
            </span>
          </button>
        ))}
        <button
          onClick={handleAddSlide}
          disabled={createSlide.isPending}
          className="shrink-0 w-7 h-7 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      <button
        onClick={() => {
          if (pollId && title) updatePoll.mutate({ pollId, title })
          slideSaveRef.current?.()
          showToast()
        }}
        className="sm:hidden fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <FloppyDisk size={20} weight="bold" />
      </button>

      <aside className="hidden sm:flex w-64 bg-white border-r border-gray-100 flex-col h-screen sticky top-0 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
          <button onClick={() => navigate('/polls')} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
            <ArrowLeft size={16} weight="bold" />
          </button>
          <span className="text-sm font-bold italic text-gray-900">UpForm</span>
        </div>

        <div className="px-4 pb-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            placeholder="Poll title..."
            className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-gray-200 hover:border-gray-400 focus:border-primary-500 px-0.5 py-1.5 transition-colors placeholder:text-gray-300"
          />
        </div>

        <div className="px-4 pb-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="font-medium">Code:</span>
              <span className="font-bold text-gray-800 tracking-wider">{poll.code}</span>
            </div>
            <button onClick={copyCode} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer" title="Copy code">
              <Copy size={13} weight="bold" />
            </button>
          </div>
          <button
            onClick={() => navigate(`/polls/${pollId}/present`)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            <Presentation size={14} weight="bold" />
            Present
          </button>
        </div>

        <div className="border-t border-gray-100" />

        <div className="p-3">
          <button
            onClick={handleAddSlide}
            disabled={createSlide.isPending}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={14} weight="bold" />
            New slide
          </button>
        </div>

        <div className="flex flex-col gap-1.5 px-3 flex-1">
          {slides.map((slide, i) => (
            <motion.div
              key={slide.id}
              layout
              onClick={() => setSelectedIndex(i)}
              className={`relative flex flex-col gap-1 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                selectedIndex === i
                  ? 'bg-primary-50 border-l-3 border-l-primary-500 border border-primary-100'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${selectedIndex === i ? 'text-primary-600' : 'text-gray-400'}`}>
                  {i + 1}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  selectedIndex === i ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {TYPE_ICONS[slide.type as SlideType]}
                  {SLIDE_TYPES.find((t) => t.value === slide.type)?.label ?? slide.type}
                </span>
              </div>
              <p
                className={`text-xs leading-snug line-clamp-2 ${
                  selectedIndex === i ? 'text-primary-700 font-medium' : 'text-gray-500'
                }`}
                dangerouslySetInnerHTML={{ __html: (selectedIndex === i && liveQuestion !== null ? liveQuestion : slide.question) || 'Untitled question' }}
              />
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSlide(slide.id) }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                >
                  <Trash size={12} weight="bold" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-100 mt-auto">
          <button
            onClick={() => {
              if (pollId && title) updatePoll.mutate({ pollId, title })
              slideSaveRef.current?.()
              showToast()
            }}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <FloppyDisk size={14} weight="bold" />
            Save
          </button>
        </div>
      </aside>

      {selectedSlide ? (
        <SlideEditorBridge
          key={selectedSlide.id}
          slide={selectedSlide}
          pollId={pollId ?? ''}
          code={poll.code}
          saveRef={slideSaveRef}
          onSaved={showToast}
          onQuestionLive={setLiveQuestion}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-center pt-32 sm:pt-0">
          <Presentation size={48} className="text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-400">No slide selected</p>
          <p className="text-xs text-gray-300 mt-1">Choose a slide from the sidebar or create a new one</p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal((s) => ({ ...s, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      <LoadingModal isOpen={loadingModal} />
      <StatusModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal((s) => ({ ...s, open: false }))}
        type={statusModal.type}
        title={statusModal.title}
        description={statusModal.description}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
          >
            <FloppyDisk size={12} weight="bold" className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlideEditorBridge({
  slide,
  pollId,
  code,
  saveRef,
  onSaved,
  onQuestionLive,
}: {
  slide: PollSlide
  pollId: string
  code: string
  saveRef: React.MutableRefObject<(() => void) | null>
  onSaved: () => void
  onQuestionLive: (q: string | null) => void
}) {
  const state = useSlideState(slide, pollId, onSaved)

  useEffect(() => {
    saveRef.current = () => state.doSave()
  }, [saveRef, state.doSave])

  useEffect(() => {
    onQuestionLive(state.question)
    return () => onQuestionLive(null)
  }, [state.question, onQuestionLive])

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-32 sm:pt-8 flex items-start justify-center">
        <div className="w-full max-w-3xl">
          <SlidePreview
            code={code}
            question={state.question}
            options={state.options}
            type={state.type}
            settings={state.settings}
            onQuestionChange={state.setQuestion}
            onQuestionBlur={(val) => state.doSave({ question: val })}
          />

          <div className="lg:hidden mt-6 bg-white rounded-xl border border-gray-100 p-4">
            <MobileSettings
              type={state.type}
              options={state.options}
              settings={state.settings}
              onTypeChange={state.setType}
              onOptionsChange={state.setOptions}
              onSettingsChange={state.setSettings}
              onBlur={() => state.doSave()}
            />
          </div>
        </div>
      </div>

      <SettingsPanel
        type={state.type}
        options={state.options}
        settings={state.settings}
        onTypeChange={state.setType}
        onOptionsChange={state.setOptions}
        onSettingsChange={state.setSettings}
        onBlur={() => state.doSave()}
      />
    </>
  )
}

function MobileSettings({
  type,
  options,
  settings,
  onTypeChange,
  onOptionsChange,
  onSettingsChange,
  onBlur,
}: {
  type: SlideType
  options: string[]
  settings: SlideSettings
  onTypeChange: (type: SlideType) => void
  onOptionsChange: (options: string[]) => void
  onSettingsChange: (settings: SlideSettings) => void
  onBlur: () => void
}) {
  const needsOptions = ['multiple_choice', 'ranking', 'hundred_points'].includes(type)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-2 block">Question type</label>
        <div className="flex flex-wrap gap-1.5">
          {SLIDE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                type === t.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {TYPE_ICONS[t.value]}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Answer options</label>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </div>
                <input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options]; next[i] = e.target.value; onOptionsChange(next)
                  }}
                  onBlur={onBlur}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
                  placeholder={`Option ${i + 1}`}
                />
                {options.length > 1 && (
                  <button onClick={() => onOptionsChange(options.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 cursor-pointer p-0.5">
                    <Trash size={12} weight="bold" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => onOptionsChange([...options, ''])}
              className="text-xs text-primary-600 font-bold self-start cursor-pointer flex items-center gap-1"
            >
              <Plus size={10} weight="bold" />
              Add option
            </button>
          </div>
        </div>
      )}

      {type === 'scales' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Scale Range</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Min</label>
              <NumberDropdown
                value={settings.maxSelections ?? 1}
                options={Array.from({ length: 10 }, (_, i) => i)}
                onChange={(min) => { onSettingsChange({ ...settings, maxSelections: min, maxWords: Math.max(settings.maxWords ?? 10, min + 1) }); onBlur() }}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Max</label>
              <NumberDropdown
                value={settings.maxWords ?? 10}
                options={Array.from({ length: 10 - (settings.maxSelections ?? 1) }, (_, i) => (settings.maxSelections ?? 1) + 1 + i)}
                onChange={(max) => { onSettingsChange({ ...settings, maxWords: max }); onBlur() }}
              />
            </div>
          </div>
        </div>
      )}

      {type === 'guess_number' && (
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Correct number</label>
          <input
            type="number"
            value={settings.correctNumber ?? ''}
            onChange={(e) => onSettingsChange({ ...settings, correctNumber: e.target.value ? Number(e.target.value) : undefined })}
            onBlur={onBlur}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white mb-3"
            placeholder="Enter the correct number"
          />
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Number range</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Min</label>
              <input
                type="number"
                value={settings.numberMin ?? 1}
                onChange={(e) => onSettingsChange({ ...settings, numberMin: Number(e.target.value) })}
                onBlur={onBlur}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-400 font-medium mb-1 block">Max</label>
              <input
                type="number"
                value={settings.numberMax ?? 100}
                onChange={(e) => onSettingsChange({ ...settings, numberMax: Number(e.target.value) })}
                onBlur={onBlur}
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
