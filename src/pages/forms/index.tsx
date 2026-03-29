import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react'
import PreviewField from '@/pages/events/preview/section/PreviewField'
import { useGetPublicEvent } from '@/hooks/events'
import { useSubmitPublicResponse } from '@/hooks/responses'
import { useMutationUploadFile } from '@/api/upload/queries'
import type { FormSection } from '@/types/form'

function loadDraft(id?: string) {
  if (!id) return null
  try {
    const raw = localStorage.getItem(`upform-draft-${id}`)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error("[loadDraft]:", err)
    return null
  }
}

export default function PublicFormPage() {
  const { id } = useParams()
  const { data: event, isLoading, isError } = useGetPublicEvent(id ?? '')
  const submitResponse = useSubmitPublicResponse(id ?? '')
  const uploadFile = useMutationUploadFile()
  const draftKey = `upform-draft-${id}`
  const pendingFilesRef = useRef<Record<string, File[]>>({})

  const [sectionHistory, setSectionHistory] = useState<number[]>(
    () => loadDraft(id)?.sectionHistory ?? [0],
  )
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    () => loadDraft(id)?.answers ?? {},
  )
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>(
    () => loadDraft(id)?.otherTexts ?? {},
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [direction, setDirection] = useState(1)
  const [shakeIds, setShakeIds] = useState<Set<string>>(new Set())
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const submittingRef = useRef(false)

  const sections = event?.sections ?? []
  const formTitle = event?.name ?? 'Untitled Form'
  const formDescription = event?.description ?? ''
  const bannerColor = event?.color ?? '#0054a5'

  useEffect(() => {
    if (event) document.title = `${event.name || 'Untitled Form'} — UpForm`
    return () => { document.title = 'UpForm' }
  }, [event])

  useEffect(() => {
    if (!id || submitted) return
    const hasData = Object.keys(answers).length > 0 || Object.keys(otherTexts).length > 0
    if (hasData) {
      localStorage.setItem(draftKey, JSON.stringify({ answers, otherTexts, sectionHistory }))
    } else {
      localStorage.removeItem(draftKey)
    }
  }, [answers, otherTexts, sectionHistory, id, submitted, draftKey])

  useEffect(() => {
    if (Object.keys(answers).length === 0 || submitted) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [answers, submitted])

  const currentSection = sectionHistory[sectionHistory.length - 1]
  const section = sections[currentSection]

  const getBranchNext = (): number | 'end' => {
    for (const field of section?.fields ?? []) {
      if (!field.branches) continue
      const answer = answers[field.id]
      if (!answer) continue
      const val = Array.isArray(answer) ? answer[0] : answer
      const target = field.branches[val]
      if (!target) continue
      if (target === 'end') return 'end'
      const idx = sections.findIndex((s) => s.id === target)
      if (idx !== -1) return idx
    }
    return currentSection + 1
  }

  const nextIdx = getBranchNext()
  const isTerminalSection =
    section?.fields.some(
      (f) => f.branches && Object.values(f.branches).every((v) => v === 'end'),
    ) ?? false
  const isLast =
    nextIdx === 'end' || nextIdx >= sections.length || isTerminalSection

  const setAnswer = (fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
    setShakeIds((prev) => {
      const next = new Set(prev)
      next.delete(fieldId)
      return next
    })
  }

  const validate = (sec: FormSection) => {
    const errs: Record<string, string> = {}
    sec.fields.forEach((f) => {
      if (f.type === 'title_block' || f.type === 'image_block') return
      const val = answers[f.id]
      if (
        f.required &&
        (!val || (Array.isArray(val) && val.length === 0) || val === '')
      ) {
        errs[f.id] = 'This question is required.'
      }
      if (f.type === 'email' && val && typeof val === 'string' && val.length > 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errs[f.id] = 'Format email tidak valid.'
        }
      }
    })
    return errs
  }

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs)
    setShakeIds(new Set(Object.keys(errs)))
    const firstId = Object.keys(errs)[0]
    fieldRefs.current[firstId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleNext = () => {
    const errs = validate(section)
    if (Object.keys(errs).length > 0) { showErrors(errs); return }
    setErrors({})
    setDirection(1)
    const next = getBranchNext()
    if (next === 'end' || next >= sections.length) {
      handleSubmit()
    } else {
      setSectionHistory((prev) => [...prev, next as number])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setErrors({})
    setDirection(-1)
    setSectionHistory((prev) => prev.slice(0, -1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    const errs = validate(section)
    if (Object.keys(errs).length > 0) { showErrors(errs); return }
    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const finalAnswers = { ...answers }
      for (const [fieldId, files] of Object.entries(pendingFilesRef.current)) {
        if (files.length === 0) continue
        const uploaded: string[] = []
        for (const file of files) {
          const result = await uploadFile.mutateAsync(file)
          uploaded.push(`${result.filename}::${result.url}`)
        }
        finalAnswers[fieldId] = uploaded.length === 1 ? uploaded[0] : uploaded
      }
      await submitResponse.mutateAsync({ answers: finalAnswers })
      pendingFilesRef.current = {}
      localStorage.removeItem(draftKey)
      setSubmitted(true)
    } finally {
      setIsSubmitting(false)
      submittingRef.current = false
    }
  }

  const handleSubmitAnother = () => {
    localStorage.removeItem(draftKey)
    pendingFilesRef.current = {}
    setAnswers({})
    setOtherTexts({})
    setErrors({})
    setSectionHistory([0])
    setSubmitted(false)
    window.scrollTo({ top: 0 })
  }

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

  if (isError || (!isLoading && !event)) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="flex items-center justify-center flex-col">
          <p className="text-lg font-black mb-4 text-primary-500">404</p>
          <p className="text-2xl font-extrabold text-black">
            Oops! This form does not exist :(
          </p>
          <p className="text-gray-400 text-lg mb-16 font-semibold">
            This form may have been closed or deleted by the owner
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen bg-gray-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div
              className="h-14 relative overflow-hidden"
              style={{ backgroundColor: bannerColor }}
            >
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/20" />
            </div>
            <div className="p-6 border-l-4" style={{ borderLeftColor: bannerColor }}>
              <h1 className="text-xl font-bold text-gray-900">{formTitle}</h1>
              <p className="text-sm text-gray-600 mt-1">Your response has been recorded.</p>
              <button
                onClick={handleSubmitAnother}
                className="text-sm font-medium mt-4 cursor-pointer hover:underline"
                style={{ color: bannerColor }}
              >
                Submit another response
              </button>
            </div>
          </div>

          <div className="text-center pt-4">
            <span className="text-[10px] text-gray-300 font-medium">
              Powered by <span className="font-bold italic">UpForm</span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div
            className="h-14 relative overflow-hidden"
            style={{ backgroundColor: bannerColor }}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/20" />
          </div>
          <div className="p-6 border-l-4" style={{ borderLeftColor: bannerColor }}>
            <h1 className="text-xl font-bold text-gray-900">{formTitle}</h1>
            {formDescription && (
              <div
                className="text-sm text-gray-900 mt-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal"
                dangerouslySetInnerHTML={{ __html: formDescription }}
              />
            )}
            {sections.some((s) => s.fields.some((f) => f.required)) && (
              <>
                <div className="-mx-6 mt-3 border-t border-gray-100" />
                <p className="text-xs text-red-500 mt-3">
                  * Menunjukkan pertanyaan yang wajib diisi
                </p>
              </>
            )}
          </div>
        </div>

        {section?.title && (
          <p className="text-sm font-semibold text-gray-600">{section.title}</p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-3"
          >
            {section?.fields.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
                No questions in this section yet.
              </div>
            )}
            {section?.fields.map((field) => (
              <PreviewField
                key={field.id}
                field={field}
                value={answers[field.id]}
                otherText={otherTexts[field.id] ?? ''}
                hasError={!!errors[field.id]}
                errorMessage={errors[field.id]}
                isShaking={shakeIds.has(field.id)}
                pendingFilesRef={pendingFilesRef}
                onAnswer={(value) => setAnswer(field.id, value)}
                onOtherTextChange={(text) =>
                  setOtherTexts((prev) => ({ ...prev, [field.id]: text }))
                }
                onAnimationComplete={() =>
                  setShakeIds((prev) => {
                    const next = new Set(prev)
                    next.delete(field.id)
                    return next
                  })
                }
                setRef={(el) => {
                  fieldRefs.current[field.id] = el
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2 gap-4">
          <button
            onClick={handleBack}
            className={`flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors py-2 px-1 cursor-pointer ${
              sectionHistory.length <= 1 ? 'invisible' : ''
            }`}
          >
            <ArrowLeftIcon size={15} weight="bold" />
            Back
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={isLast ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-primary-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors duration-150 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <SpinnerGapIcon size={15} className="animate-spin" />
            ) : isLast ? (
              'Submit'
            ) : (
              <>
                Next <ArrowRightIcon size={15} weight="bold" />
              </>
            )}
          </motion.button>
        </div>

        <div className="text-center pt-4">
          <span className="text-[10px] text-gray-300 font-medium">
            Powered by <span className="font-bold italic">UpForm</span>
          </span>
        </div>
      </div>
    </div>
  )
}
