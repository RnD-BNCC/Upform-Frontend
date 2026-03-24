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
import {
  SlidePreview,
  SettingsPanel,
  MobileSlideNav,
  SlidesSidebar,
  MobileSettings,
} from './components'
import { FloppyDisk, SpinnerGap, Presentation } from '@phosphor-icons/react'

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

  const handleSave = () => {
    if (pollId && title) updatePoll.mutate({ pollId, title })
    slideSaveRef.current?.()
    showToast()
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
      <MobileSlideNav
        title={title}
        slides={slides}
        selectedIndex={selectedIndex}
        onBack={() => navigate('/polls')}
        onTitleChange={setTitle}
        onTitleBlur={handleSaveTitle}
        onSelectSlide={setSelectedIndex}
        onAddSlide={handleAddSlide}
        onPresent={() => navigate(`/polls/${pollId}/present`)}
        onSave={handleSave}
        isAddPending={createSlide.isPending}
      />

      <SlidesSidebar
        title={title}
        pollCode={poll.code}
        slides={slides}
        selectedIndex={selectedIndex}
        liveQuestion={liveQuestion}
        onBack={() => navigate('/polls')}
        onTitleChange={setTitle}
        onTitleBlur={handleSaveTitle}
        onSelectSlide={setSelectedIndex}
        onAddSlide={handleAddSlide}
        onDeleteSlide={handleDeleteSlide}
        onCopyCode={copyCode}
        onPresent={() => navigate(`/polls/${pollId}/present`)}
        onSave={handleSave}
        isAddPending={createSlide.isPending}
      />

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
