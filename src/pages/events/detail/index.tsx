import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { QuestionCard, FieldTypeSidebar, BuilderHeader, FormCover, SectionCard } from '@/components/builder'
import { mockEvents } from '@/mock/events'
import type { FormField, FormSection, FieldType, FormResponse } from '@/types/form'
import {
  ClipboardTextIcon,
  CalendarBlankIcon,
  UsersIcon,
} from '@phosphor-icons/react'

type Tab = 'questions' | 'responses'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const existing = mockEvents.find((e) => e.id === id)
  const createState = location.state as { title?: string; description?: string } | null

  const [formTitle, setFormTitle] = useState(
    createState?.title ?? existing?.name ?? 'Untitled Form',
  )
  const [formDescription, setFormDescription] = useState(
    createState?.description ?? existing?.description ?? '',
  )
  const [bannerColor, setBannerColor] = useState(existing?.color ?? '#0054a5')
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const questionsEndRef = useRef<HTMLDivElement>(null)
  const initialSections: FormSection[] = existing?.sections?.length
    ? existing.sections
    : [{ id: crypto.randomUUID(), title: '', fields: [] }]
  const [history, setHistory] = useState<{ stack: FormSection[][]; index: number }>({
    stack: [initialSections],
    index: 0,
  })
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
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
  }, [])

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
      // Move fields to previous section
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
  const responses: FormResponse[] = existing?.responses ?? []

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
        onBack={() => navigate('/')}
        onPreview={() => navigate(`/events/${id}/preview`, { state: { sections, formTitle, formDescription, bannerColor, bannerImage } })}
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
          <div className="flex-1 min-w-0">
            {responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 h-64">
                <ClipboardTextIcon size={44} weight="light" className="text-gray-300" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">No responses yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Share your form to start collecting responses.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <UsersIcon size={18} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{responses.length}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Total Responses</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <CalendarBlankIcon size={18} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(responses[responses.length - 1].submittedAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Last Response</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-8">#</th>
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">Submitted</th>
                          {allFields.map((f) => (
                            <th key={f.id} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap max-w-40">
                              <span className="block truncate">{f.label}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((r, i) => (
                          <motion.tr
                            key={r.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {new Date(r.submittedAt).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short',
                              })}{' '}
                              <span className="text-gray-400">
                                {new Date(r.submittedAt).toLocaleTimeString('en-GB', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </td>
                            {allFields.map((f) => {
                              const val = r.answers[f.id]
                              const display = Array.isArray(val) ? val.join(', ') : (val ?? '—')
                              return (
                                <td key={f.id} className="px-4 py-3 text-xs text-gray-700 max-w-48">
                                  <span className="block truncate" title={display}>{display || '—'}</span>
                                </td>
                              )
                            })}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
