import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { QuestionCard, FieldTypeSidebar, BuilderHeader, FormCover, SectionCard, ShareDialog } from '@/components/builder'
import { ConfirmModal, LoadingModal, StatusModal } from '@/components/ui'
import { useGetEventDetail, useUpdateEvent } from '@/hooks/events'
import { useUpdateSection } from '@/hooks/sections'
import { useGetResponses } from '@/hooks/responses'
import type { FormField, FormSection, FieldType } from '@/types/form'
import { ResponsesPanel } from '@/components/responses'
import { SpinnerGapIcon } from '@phosphor-icons/react'

type Tab = 'questions' | 'responses'

type SavedSnapshot = {
  title: string
  description: string
  color: string
  sections: FormSection[]
}

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: existing, isLoading } = useGetEventDetail(id ?? '')
  const { data: responses = [] } = useGetResponses(id ?? '')
  const updateEvent = useUpdateEvent()
  const updateSection = useUpdateSection(id ?? '')
  const [formTitle, setFormTitle] = useState('Untitled Form')
  const [formDescription, setFormDescription] = useState('')
  const [bannerColor, setBannerColor] = useState('#0054a5')
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const questionsEndRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<{ stack: FormSection[][]; index: number }>({
    stack: [[{ id: crypto.randomUUID(), title: '', fields: [] }]],
    index: 0,
  })
  const [initialized, setInitialized] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(null)
  const [eventStatus, setEventStatus] = useState<'draft' | 'active' | 'closed'>('draft')
  const [isPublishing, setIsPublishing] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'unpublish' | 'close' | 'publish' | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [statusResult, setStatusResult] = useState<'unpublish' | 'close' | null>(null)

  useEffect(() => {
    if (initialized) return
    if (isLoading) return
    if (existing) {
      const title = existing.name || 'Untitled Form'
      const desc = existing.description || ''
      const color = existing.color || '#0054a5'
      const secs = existing.sections?.length
        ? existing.sections
        : [{ id: crypto.randomUUID(), title: '', fields: [] }]
      setFormTitle(title)
      setFormDescription(desc)
      setBannerColor(color)
      setHistory({ stack: [secs], index: 0 })
      setSavedSnapshot({ title, description: desc, color, sections: secs })
      setEventStatus(existing.status)
      setInitialized(true)
    } else {
      navigate('/', { replace: true })
    }
  }, [existing, isLoading, initialized, navigate])

  // Keep eventStatus in sync when the query refetches (e.g. after publishing from home page)
  useEffect(() => {
    if (initialized && existing) {
      setEventStatus(existing.status)
    }
  }, [initialized, existing?.status])

  const sections = history.stack[history.index]
  const setSections = (updater: FormSection[] | ((prev: FormSection[]) => FormSection[])) => {
    setHistory((prev) => {
      const current = prev.stack[prev.index]
      const next = typeof updater === 'function' ? updater(current) : updater
      const newStack = prev.stack.slice(0, prev.index + 1)
      newStack.push(next)
      return { stack: newStack, index: prev.index + 1 }
    })
  }

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false
    if (formTitle !== savedSnapshot.title) return true
    if (formDescription !== savedSnapshot.description) return true
    if (bannerColor !== savedSnapshot.color) return true
    return JSON.stringify(sections) !== JSON.stringify(savedSnapshot.sections)
  }, [formTitle, formDescription, bannerColor, sections, savedSnapshot])

  const handleSave = useCallback(async () => {
    if (!id || isSaving) return
    setIsSaving(true)
    try {
      await updateEvent.mutateAsync({
        eventId: id,
        name: formTitle,
        description: formDescription,
        color: bannerColor,
      })
      await Promise.all(
        sections.map((s) =>
          updateSection.mutateAsync({
            sectionId: s.id,
            title: s.title,
            description: s.description,
            fields: s.fields,
          }),
        ),
      )
      setSavedSnapshot({
        title: formTitle,
        description: formDescription,
        color: bannerColor,
        sections: JSON.parse(JSON.stringify(sections)),
      })
    } finally {
      setIsSaving(false)
    }
  }, [id, isSaving, formTitle, formDescription, bannerColor, sections, updateEvent, updateSection])

  const handlePublish = useCallback(async () => {
    if (!id || isPublishing) return
    setConfirmAction(null)
    if (isDirty) await handleSave()
    setIsPublishing(true)
    try {
      await updateEvent.mutateAsync({ eventId: id, status: 'active' })
      setEventStatus('active')
      setShowShareDialog(true)
    } finally {
      setIsPublishing(false)
    }
  }, [id, isPublishing, isDirty, handleSave, updateEvent])

  const handleStatusChange = useCallback(async (action: 'unpublish' | 'close') => {
    if (!id || isChangingStatus) return
    setConfirmAction(null)
    setIsChangingStatus(true)
    try {
      const status = action === 'unpublish' ? 'draft' : 'closed'
      await updateEvent.mutateAsync({ eventId: id, status })
      setEventStatus(status)
      setStatusResult(action)
    } finally {
      setIsChangingStatus(false)
    }
  }, [id, isChangingStatus, updateEvent])

  const publicFormUrl = `${window.location.origin}/forms/${id}`

  // Ctrl+S + undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        setHistory((prev) => (prev.index <= 0 ? prev : { ...prev, index: prev.index - 1 }))
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        setHistory((prev) =>
          prev.index >= prev.stack.length - 1 ? prev : { ...prev, index: prev.index + 1 },
        )
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // Browser refresh/close guard
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [, setActiveId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('questions')

  const addField = (type: FieldType, sectionId: string, initialImageUrl?: string) => {
    const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(type)
    const isTitleBlock = type === 'title_block'
    const isMedia = type === 'image_block'
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: isTitleBlock || isMedia ? '' : 'Untitled Question',
      required: false,
      options: hasOptions ? ['Option 1'] : undefined,
      ...(initialImageUrl ? { headerImage: initialImageUrl, imageWidth: 100, imageAlign: 'left' as const } : {}),
    }
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s)),
    )
    setSelectedId(newField.id)
    setTimeout(() => questionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) },
      ),
    )
  }

  const deleteField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId ? s : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) },
      ),
    )
    if (selectedId === fieldId) setSelectedId(null)
  }

  const duplicateField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s
        const field = s.fields.find((f) => f.id === fieldId)
        if (!field) return s
        const newField: FormField = { ...field, id: crypto.randomUUID() }
        const idx = s.fields.findIndex((f) => f.id === fieldId)
        const updated = [...s.fields]
        updated.splice(idx + 1, 0, newField)
        return { ...s, fields: updated }
      }),
    )
  }

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: '', description: undefined, fields: [] },
    ])
    setTimeout(() => questionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
  }

  const deleteSection = (sectionId: string) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId)
      if (idx <= 0 || prev.length <= 1) return prev
      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }))
      next[idx - 1].fields.push(...next[idx].fields)
      next.splice(idx, 1)
      return next
    })
  }

  const findFieldInfo = (fieldId: string) => {
    for (const section of sections) {
      const idx = section.fields.findIndex((f) => f.id === fieldId)
      if (idx !== -1) return { sectionId: section.id, fieldIdx: idx }
    }
    return null
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeInfo = findFieldInfo(active.id as string)
    const overInfo = findFieldInfo(over.id as string)
    if (!activeInfo || !overInfo || activeInfo.sectionId === overInfo.sectionId) return
    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }))
      const src = next.find((s) => s.id === activeInfo.sectionId)!
      const dst = next.find((s) => s.id === overInfo.sectionId)!
      const [moved] = src.fields.splice(activeInfo.fieldIdx, 1)
      const dstIdx = dst.fields.findIndex((f) => f.id === over.id)
      dst.fields.splice(dstIdx >= 0 ? dstIdx : dst.fields.length, 0, moved)
      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    const activeInfo = findFieldInfo(active.id as string)
    const overInfo = findFieldInfo(over.id as string)
    if (!activeInfo || !overInfo || activeInfo.sectionId !== overInfo.sectionId) return
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== activeInfo.sectionId) return s
        return { ...s, fields: arrayMove(s.fields, activeInfo.fieldIdx, overInfo.fieldIdx) }
      }),
    )
  }

  const lastSectionId = sections[sections.length - 1]?.id
  const allFields = sections.flatMap((s) => s.fields)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <SpinnerGapIcon size={32} className="text-primary-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
      onClick={() => setSelectedId(null)}
    >
      <BuilderHeader
        formTitle={formTitle}
        onTitleChange={setFormTitle}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => isDirty ? setShowLeaveDialog(true) : navigate('/')}
        onPreview={() => navigate(`/forms/${id}/preview`, { state: { sections, formTitle, formDescription, bannerColor, bannerImage } })}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
        eventStatus={eventStatus}
        onPublish={() => setConfirmAction('publish')}
        isPublishing={isPublishing}
        onShare={() => setShowShareDialog(true)}
        onUnpublish={() => setConfirmAction('unpublish')}
        onClose={() => setConfirmAction('close')}
      />

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex gap-5">
        {activeTab === 'questions' ? (
          <>
            <div className="flex-1 space-y-3 min-w-0 pb-20 sm:pb-0" onClick={(e) => e.stopPropagation()}>
              <FormCover
                bannerColor={bannerColor}
                bannerImage={bannerImage}
                onBannerColorChange={setBannerColor}
                onBannerImageChange={setBannerImage}
                formTitle={formTitle}
                onTitleChange={setFormTitle}
                formDescription={formDescription}
                onDescriptionChange={setFormDescription}
              />

              <DndContext
                collisionDetection={closestCenter}
                onDragStart={(e) => setActiveId(e.active.id as string)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {sections.map((section, sectionIdx) => (
                  <div key={section.id} className="space-y-3">
                    {sectionIdx > 0 && (
                      <SectionCard
                        section={section}
                        sectionIdx={sectionIdx}
                        totalSections={sections.length}
                        onTitleChange={(v) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, title: v } : s))}
                        onDescriptionChange={(v) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, description: v || undefined } : s))}
                        onDelete={() => deleteSection(section.id)}
                        accentColor={bannerColor}
                      />
                    )}

                    <SortableContext
                      items={section.fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <AnimatePresence>
                        {section.fields.map((field) => (
                          <QuestionCard
                            key={field.id}
                            field={field}
                            sections={sections}
                            isSelected={selectedId === field.id}
                            onSelect={() => setSelectedId(field.id)}
                            onChange={(updates) => updateField(section.id, field.id, updates)}
                            onDelete={() => deleteField(section.id, field.id)}
                            onDuplicate={() => duplicateField(section.id, field.id)}
                            accentColor={bannerColor}
                          />
                        ))}
                      </AnimatePresence>
                    </SortableContext>

                    {section.fields.length === 0 && (
                      <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                        Use the toolbar on the right to add a question
                      </div>
                    )}
                  </div>
                ))}
                <div ref={questionsEndRef} />
              </DndContext>
            </div>

            <FieldTypeSidebar
              onAddQuestion={() => addField('short_text', lastSectionId)}
              onAddTitleBlock={() => addField('title_block', lastSectionId)}
              onAddSection={addSection}
              onAddImageBlock={(url) => addField('image_block', lastSectionId, url)}
            />
          </>
        ) : (
          <ResponsesPanel
            responses={responses}
            allFields={allFields}
          />
        )}
      </div>

      {/* Unsaved changes navigation dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLeaveDialog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-gray-900">Unsaved Changes</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                You have unsaved changes that will be lost if you leave this page. Would you like to stay and save your work?
              </p>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => { setShowLeaveDialog(false); navigate('/') }}
                  className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Leave
                </button>
                <button
                  onClick={() => setShowLeaveDialog(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  Stay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share dialog */}
      <AnimatePresence>
        {showShareDialog && (
          <ShareDialog url={publicFormUrl} onClose={() => setShowShareDialog(false)} />
        )}
      </AnimatePresence>

      {/* Confirm action modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === 'publish') handlePublish()
          else if (confirmAction) handleStatusChange(confirmAction)
        }}
        variant="warning"
        title={
          confirmAction === 'publish' ? (eventStatus === 'closed' ? 'Reopen Form?' : 'Publish Form?')
            : confirmAction === 'unpublish' ? 'Unpublish Form?'
            : 'Close Form?'
        }
        description={
          confirmAction === 'publish'
            ? (eventStatus === 'closed'
              ? 'This will reopen your form and make it live again. Anyone with the link can submit responses.'
              : 'This will make your form live. Anyone with the link can submit responses.')
            : confirmAction === 'unpublish'
              ? 'This will take your form offline. It will no longer accept responses until you publish it again.'
              : 'This will permanently close your form. It will no longer accept any new responses.'
        }
        confirmText={
          confirmAction === 'publish' ? (eventStatus === 'closed' ? 'Reopen' : 'Publish')
            : confirmAction === 'unpublish' ? 'Unpublish'
            : 'Close Form'
        }
      />

      {/* Loading modal */}
      <LoadingModal isOpen={isChangingStatus || isPublishing} />

      {/* Status result modal */}
      <StatusModal
        isOpen={!!statusResult}
        onClose={() => setStatusResult(null)}
        type="success"
        title={statusResult === 'unpublish' ? 'Form Unpublished!' : 'Form Closed!'}
        description={
          statusResult === 'unpublish'
            ? 'Your form has been unpublished. You can publish it again anytime.'
            : 'Your form has been closed and will no longer accept responses.'
        }
        buttonText="Continue"
        onButtonClick={() => setStatusResult(null)}
      />
    </div>
  )
}
