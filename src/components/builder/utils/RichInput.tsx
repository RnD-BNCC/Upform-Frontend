import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LinkSimpleIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  CaretDownIcon,
  TextBolderIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  TextStrikethroughIcon,
  CodeSimpleIcon,
} from '@phosphor-icons/react'
import type { FormField } from '@/types/form'
import ReferencePickerPopover from '@/components/builder/layout/reference/ReferencePickerPopover'
import {
  createCalculationReferenceTokenHtml,
  createDateReferenceTokenHtml,
  createFieldReferenceTokenHtml,
  hydrateReferenceTokenElements,
  stripHtmlToText,
  type DateReferenceOption,
} from '@/utils/form/referenceTokens'
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";

const isEmpty = (html: string) =>
  !/<(ul|ol|li)\b/i.test(html) &&
  !html.replace(/<br\s*\/?>/gi, '').replace(/<[^>]*>/g, '').trim()

const sanitizePaste = (html: string): string => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  tmp.querySelectorAll('img, picture, video, audio, iframe, canvas, svg').forEach((el) => el.remove())
  tmp.querySelectorAll('pre, code').forEach((el) => {
    el.replaceWith(document.createTextNode(el.textContent ?? ''))
  })
  return tmp.innerHTML
}

const hasActiveReferenceTrigger = (root: HTMLElement | null) => {
  if (!root) return false

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const range = selection.getRangeAt(0)
  if (!root.contains(range.startContainer)) return false

  const prefixRange = range.cloneRange()
  prefixRange.selectNodeContents(root)
  prefixRange.setEnd(range.startContainer, range.startOffset)

  return /(^|\s)@[^\s@]*$/.test(prefixRange.toString())
}

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  placeholderClassName?: string
  className?: string
  containerClassName?: string
  readOnly?: boolean
  stopPropagation?: boolean
  noLists?: boolean
  staticToolbar?: boolean
  referenceFields?: FormField[]
  referenceFieldGroups?: ConditionFieldGroup[]
  allowDateUtilities?: boolean
}

const HEADINGS = [
  { label: 'Normal', tag: 'p' },
  { label: 'H1', tag: 'h1' },
  { label: 'H2', tag: 'h2' },
  { label: 'H3', tag: 'h3' },
  { label: 'H4', tag: 'h4' },
  { label: 'H5', tag: 'h5' },
]

export default function RichInput({
  value,
  onChange,
  placeholder,
  placeholderClassName,
  className = '',
  containerClassName = 'w-full',
  readOnly = false,
  stopPropagation,
  noLists,
  staticToolbar,
  referenceFields = [],
  referenceFieldGroups,
  allowDateUtilities = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)
  const lastValueRef = useRef(value)
  const undoStackRef = useRef<string[]>([])
  const redoStackRef = useRef<string[]>([])
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false })
  const [linkDialog, setLinkDialog] = useState<{ text: string; url: string } | null>(null)
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [referencePickerOpen, setReferencePickerOpen] = useState(false)
  const linkDialogOpenRef = useRef(false)
  const savedRangeRef = useRef<Range | null>(null)
  const referenceRangeRef = useRef<Range | null>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value
      hydrateReferenceTokenElements(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount only

  useEffect(() => {
    if (!focusedRef.current && ref.current && lastValueRef.current !== value) {
      ref.current.innerHTML = value
      hydrateReferenceTokenElements(ref.current)
    }
    lastValueRef.current = value
  }, [value])

  const updateToolbar = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })

    if (!focusedRef.current || linkDialogOpenRef.current) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.toString().length === 0) {
      setToolbarPos(null)
      return
    }

    const range = sel.getRangeAt(0)
    const rangeRect = range.getBoundingClientRect()
    if (!containerRef.current || rangeRect.width === 0) {
      setToolbarPos(null)
      return
    }
    const left = Math.max(4, Math.min(rangeRect.left + rangeRect.width / 2 - 140, window.innerWidth - 284))
    const top = Math.max(4, rangeRect.top - 48)

    setToolbarPos({ top, left })
  }, [])

  const pushUndoSnapshot = useCallback(() => {
    if (!ref.current) return
    undoStackRef.current.push(ref.current.innerHTML)
    redoStackRef.current = []
  }, [])

  const execFormat = (cmd: string, val?: string) => {
    if (document.activeElement !== ref.current) ref.current?.focus()
    document.execCommand(cmd, false, val)
    if (ref.current) {
      hydrateReferenceTokenElements(ref.current)
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
    updateToolbar()
  }

  const applyHeading = (tag: string) => {
    if (document.activeElement !== ref.current) ref.current?.focus()
    document.execCommand('formatBlock', false, tag)
    if (ref.current) {
      hydrateReferenceTokenElements(ref.current)
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
    setShowHeadingDropdown(false)
    updateToolbar()
  }

  const toggleList = useCallback((type: 'ul' | 'ol') => {
    if (!ref.current) return
    if (document.activeElement !== ref.current) ref.current.focus()
    pushUndoSnapshot()
    const sel = window.getSelection()
    if (!sel) return

    let listNode: Element | null = null
    let n: Node | null = sel.rangeCount > 0 ? sel.getRangeAt(0).startContainer : null
    while (n && n !== ref.current) {
      if (n instanceof Element && (n.tagName === 'UL' || n.tagName === 'OL')) { listNode = n; break }
      n = n.parentNode
    }

    if (listNode) {
      if (listNode.tagName === type.toUpperCase()) {
        const frag = document.createDocumentFragment()
        listNode.querySelectorAll('li').forEach((li) => {
          const p = document.createElement('p')
          p.innerHTML = li.innerHTML
          frag.appendChild(p)
        })
        listNode.replaceWith(frag)
      } else {
        const newList = document.createElement(type)
        listNode.querySelectorAll('li').forEach((li) => {
          const newLi = document.createElement('li')
          newLi.innerHTML = li.innerHTML
          newList.appendChild(newLi)
        })
        listNode.replaceWith(newList)
      }
    } else {
      const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null
      if (!range) return
      const list = document.createElement(type)
      const li = document.createElement('li')
      li.appendChild(range.extractContents())
      list.appendChild(li)
      range.insertNode(list)
      const newRange = document.createRange()
      newRange.setStart(li, 0)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    }

    if (ref.current) {
      hydrateReferenceTokenElements(ref.current)
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
  }, [pushUndoSnapshot, onChange])

  const startListAtCursor = useCallback((type: 'ul' | 'ol') => {
    if (!ref.current) return
    pushUndoSnapshot()
    const cmd = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'
    document.execCommand(cmd, false)
    if (ref.current) {
      hydrateReferenceTokenElements(ref.current)
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
  }, [pushUndoSnapshot, onChange])

  const closeReferencePicker = useCallback(() => {
    setReferencePickerOpen(false)
    referenceRangeRef.current = null
  }, [])

  const syncReferencePickerToSelection = useCallback(() => {
    if (!referencePickerOpen) return
    if (!hasActiveReferenceTrigger(ref.current)) {
      closeReferencePicker()
    }
  }, [closeReferencePicker, referencePickerOpen])

  const insertReferenceToken = useCallback((tokenHtml: string) => {
    if (!ref.current) return

    ref.current.focus()
    const selection = window.getSelection()
    if (!selection) return

    const targetRange =
      referenceRangeRef.current?.cloneRange() ??
      (selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null)

    if (!targetRange) return

    selection.removeAllRanges()
    selection.addRange(targetRange)

    const range = selection.getRangeAt(0)
    const startContainer = range.startContainer

    if (startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = startContainer as Text
      const startOffset = range.startOffset
      if (startOffset > 0 && textNode.data[startOffset - 1] === '@') {
        textNode.deleteData(startOffset - 1, 1)
        range.setStart(textNode, startOffset - 1)
        range.collapse(true)
      }
    }

    const tokenContainer = document.createElement('div')
    tokenContainer.innerHTML = tokenHtml
    const tokenElement = tokenContainer.firstElementChild
    if (!tokenElement) return

    hydrateReferenceTokenElements(tokenContainer)
    range.insertNode(tokenElement)

    const spacerNode = document.createTextNode(' ')
    tokenElement.after(spacerNode)

    const nextRange = document.createRange()
    nextRange.setStart(spacerNode, spacerNode.data.length)
    nextRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(nextRange)

    if (ref.current) {
      hydrateReferenceTokenElements(ref.current)
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }

    closeReferencePicker()
  }, [closeReferencePicker, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (stopPropagation) e.stopPropagation()

    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === 'z' && !e.shiftKey && undoStackRef.current.length > 0) {
        e.preventDefault()
        const prev = undoStackRef.current.pop()!
        redoStackRef.current.push(ref.current?.innerHTML ?? '')
        if (ref.current) {
          ref.current.innerHTML = prev
          lastValueRef.current = prev
          onChange(prev)
        }
        return
      }
      if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && redoStackRef.current.length > 0) {
        e.preventDefault()
        const next = redoStackRef.current.pop()!
        undoStackRef.current.push(ref.current?.innerHTML ?? '')
        if (ref.current) {
          ref.current.innerHTML = next
          lastValueRef.current = next
          onChange(next)
        }
        return
      }
    }

    if (e.key !== ' ' || noLists) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !ref.current) return
    const range = sel.getRangeAt(0)
    if (!range.collapsed) return
    const container = range.startContainer
    if (container.nodeType !== Node.TEXT_NODE) return
    const textBefore = (container.textContent ?? '').slice(0, range.startOffset)
    if (textBefore === '-') {
      e.preventDefault()
      ;(container as Text).deleteData(0, 1)
      startListAtCursor('ul')
    } else if (/^\d+\.$/.test(textBefore)) {
      e.preventDefault()
      ;(container as Text).deleteData(0, textBefore.length)
      startListAtCursor('ol')
    }
  }, [stopPropagation, noLists, startListAtCursor, onChange])

  const handleLinkMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const sel = window.getSelection()
    savedRangeRef.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    const selectedText = sel?.toString() ?? ''
    linkDialogOpenRef.current = true
    setLinkDialog({ text: selectedText, url: '' })
    setToolbarPos(null)
  }

  const applyLink = () => {
    if (!linkDialog) return
    const sel = window.getSelection()
    if (savedRangeRef.current) {
      sel?.removeAllRanges()
      sel?.addRange(savedRangeRef.current)
    }
    ref.current?.focus()
    if (linkDialog.text) {
      document.execCommand('insertHTML', false, `<a href="${linkDialog.url}" target="_blank">${linkDialog.text}</a>`)
    } else {
      document.execCommand('createLink', false, linkDialog.url)
    }
    if (ref.current) {
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
    linkDialogOpenRef.current = false
    setLinkDialog(null)
    setToolbarPos(null)
    savedRangeRef.current = null
  }

  // Listen for selection changes while focused
  useEffect(() => {
    const handler = () => {
      if (focusedRef.current) updateToolbar()
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [updateToolbar])

  const fmtBtn = (active: boolean, label: React.ReactNode, cmd: string, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); execFormat(cmd) }}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active ? 'bg-primary-100 text-primary-600' : 'text-gray-200 hover:bg-white/20 hover:text-white'
      }`}
    >
      {label}
    </button>
  )

  const toolbarEl = readOnly ? null : (
    <AnimatePresence>
      {toolbarPos && !linkDialog && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.1 }}
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-[9999] flex items-center gap-0.5 bg-gray-900 rounded-xl px-1.5 py-1 shadow-xl border border-white/10"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
            {/* Heading dropdown */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setShowHeadingDropdown((v) => !v) }}
                className="flex items-center gap-0.5 h-7 px-1.5 rounded text-gray-200 hover:bg-white/20 hover:text-white transition-colors text-[11px] font-semibold"
              >
                <span>T</span>
                <CaretDownIcon size={9} />
              </button>
              <AnimatePresence>
                {showHeadingDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-28 z-50"
                  >
                    {HEADINGS.map((h) => (
                      <button
                        key={h.tag}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); applyHeading(h.tag) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        {h.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-4 bg-white/20 mx-0.5" />

            {fmtBtn(activeFormats.bold, <TextBolderIcon size={13} />, 'bold', 'Bold')}
            {fmtBtn(activeFormats.italic, <TextItalicIcon size={13} />, 'italic', 'Italic')}
            {fmtBtn(activeFormats.underline, <TextUnderlineIcon size={13} />, 'underline', 'Underline')}

            <div className="w-px h-4 bg-white/20 mx-0.5" />

            {/* Alignment */}
            <button
              type="button"
              title="Align left"
              onMouseDown={(e) => { e.preventDefault(); execFormat('justifyLeft') }}
              className="w-7 h-7 flex items-center justify-center text-gray-200 hover:bg-white/20 hover:text-white rounded transition-colors"
            >
              <TextAlignLeftIcon size={13} />
            </button>
            <button
              type="button"
              title="Align center"
              onMouseDown={(e) => { e.preventDefault(); execFormat('justifyCenter') }}
              className="w-7 h-7 flex items-center justify-center text-gray-200 hover:bg-white/20 hover:text-white rounded transition-colors"
            >
              <TextAlignCenterIcon size={13} />
            </button>
            <button
              type="button"
              title="Align right"
              onMouseDown={(e) => { e.preventDefault(); execFormat('justifyRight') }}
              className="w-7 h-7 flex items-center justify-center text-gray-200 hover:bg-white/20 hover:text-white rounded transition-colors"
            >
              <TextAlignRightIcon size={13} />
            </button>

            <div className="w-px h-4 bg-white/20 mx-0.5" />

            {!noLists && (
              <>
                <button
                  type="button"
                  title="Bulleted list"
                  onMouseDown={(e) => { e.preventDefault(); toggleList('ul') }}
                  className="w-7 h-7 flex items-center justify-center text-gray-200 hover:bg-white/20 hover:text-white rounded transition-colors"
                >
                  <ListBulletsIcon size={13} />
                </button>
                <button
                  type="button"
                  title="Numbered list"
                  onMouseDown={(e) => { e.preventDefault(); toggleList('ol') }}
                  className="w-7 h-7 flex items-center justify-center text-gray-200 hover:bg-white/20 hover:text-white rounded transition-colors"
                >
                  <ListNumbersIcon size={13} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-0.5" />
              </>
            )}

            <button
              type="button"
              title="Insert link"
              onMouseDown={handleLinkMouseDown}
              className="w-7 h-7 flex items-center justify-center text-gray-200 hover:bg-white/20 hover:text-white rounded transition-colors"
            >
              <LinkSimpleIcon size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
  )

  const staticToolbarEl = staticToolbar ? (
    <div
      className={`theme-answer-border theme-question-caption flex items-center gap-0.5 border-b border-gray-100 px-2 py-1.5 text-gray-400 ${
        readOnly ? "pointer-events-none" : ""
      }`}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); execFormat('bold') }}
        className={`theme-question-caption flex h-6 w-6 items-center justify-center rounded text-xs font-bold transition-colors ${activeFormats.bold ? 'bg-black/5' : 'opacity-70 hover:bg-black/5 hover:opacity-100'}`}>
        <TextBolderIcon size={12} />
      </button>
      <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); execFormat('italic') }}
        className={`theme-question-caption flex h-6 w-6 items-center justify-center rounded transition-colors ${activeFormats.italic ? 'bg-black/5' : 'opacity-70 hover:bg-black/5 hover:opacity-100'}`}>
        <TextItalicIcon size={12} />
      </button>
      <button type="button" title="Strikethrough" onMouseDown={(e) => { e.preventDefault(); execFormat('strikeThrough') }}
        className="theme-question-caption flex h-6 w-6 items-center justify-center rounded opacity-70 transition-colors hover:bg-black/5 hover:opacity-100">
        <TextStrikethroughIcon size={12} />
      </button>
      <button type="button" title="Code" onMouseDown={(e) => { e.preventDefault(); execFormat('formatBlock', 'pre') }}
        className="theme-question-caption flex h-6 w-6 items-center justify-center rounded opacity-70 transition-colors hover:bg-black/5 hover:opacity-100">
        <CodeSimpleIcon size={12} />
      </button>
      <div className="theme-answer-border mx-0.5 h-3.5 border-l border-gray-200" />
      {(['h1', 'h2', 'h3'] as const).map((tag, i) => (
        <button key={tag} type="button" title={tag.toUpperCase()} onMouseDown={(e) => { e.preventDefault(); applyHeading(tag) }}
          className="theme-question-caption flex h-6 items-center justify-center rounded px-1 text-[10px] font-semibold opacity-70 transition-colors hover:bg-black/5 hover:opacity-100">
          H<sub>{i + 1}</sub>
        </button>
      ))}
      <div className="theme-answer-border mx-0.5 h-3.5 border-l border-gray-200" />
      <button type="button" title="Bulleted list" onMouseDown={(e) => { e.preventDefault(); toggleList('ul') }}
        className="theme-question-caption flex h-6 w-6 items-center justify-center rounded opacity-70 transition-colors hover:bg-black/5 hover:opacity-100">
        <ListBulletsIcon size={12} />
      </button>
      <button type="button" title="Numbered list" onMouseDown={(e) => { e.preventDefault(); toggleList('ol') }}
        className="theme-question-caption flex h-6 w-6 items-center justify-center rounded opacity-70 transition-colors hover:bg-black/5 hover:opacity-100">
        <ListNumbersIcon size={12} />
      </button>
    </div>
  ) : null

  const displayPlaceholder = placeholder
    ? stripHtmlToText(placeholder) || placeholder
    : ''

  return (
    <div
      ref={containerRef}
      className={`relative overflow-visible ${containerClassName}`}
      data-rich-container
    >
      {!readOnly ? createPortal(toolbarEl, document.body) : null}
      {staticToolbarEl}

      <div className="relative">
        {/* Placeholder */}
        {isEmpty(value) && (
          <span className={`absolute inset-0 pointer-events-none leading-normal select-none ${placeholderClassName ?? 'text-gray-400'}`}>
            {displayPlaceholder}
          </span>
        )}

        {/* Editable content */}
        <div
          ref={ref}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onClick={
            readOnly
              ? undefined
              : stopPropagation
                ? (e) => e.stopPropagation()
                : undefined
          }
          onKeyDown={readOnly ? undefined : handleKeyDown}
          onKeyUp={
            readOnly
              ? undefined
              : (event) => {
                  updateToolbar()
                  if (event.key === '@') {
                    const sel = window.getSelection()
                    if (sel && sel.rangeCount > 0) {
                      referenceRangeRef.current = sel.getRangeAt(0).cloneRange()
                      setReferencePickerOpen(true)
                    }
                    return
                  }

                  syncReferencePickerToSelection()
                }
          }
          onMouseUp={
            readOnly
              ? undefined
              : () => {
                  updateToolbar()
                  syncReferencePickerToSelection()
                }
          }
          onPaste={
            readOnly
              ? undefined
              : (e) => {
                  e.preventDefault()
                  const html = e.clipboardData.getData('text/html')
                  if (html) {
                    document.execCommand('insertHTML', false, sanitizePaste(html))
                  } else {
                    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
                  }
                  if (ref.current) {
                    hydrateReferenceTokenElements(ref.current)
                    lastValueRef.current = ref.current.innerHTML
                    onChange(ref.current.innerHTML)
                  }
                  syncReferencePickerToSelection()
                }
          }
          onInput={
            readOnly
              ? undefined
              : () => {
                  if (ref.current) {
                    hydrateReferenceTokenElements(ref.current)
                    lastValueRef.current = ref.current.innerHTML
                    onChange(ref.current.innerHTML)
                  }
                  syncReferencePickerToSelection()
                }
          }
          onFocus={
            readOnly
              ? undefined
              : () => {
                  focusedRef.current = true
                  updateToolbar()
                }
          }
          onBlur={
            readOnly
              ? undefined
              : () => {
                  focusedRef.current = false
                  if (!linkDialogOpenRef.current) {
                    setToolbarPos(null)
                    setShowHeadingDropdown(false)
                  }
                }
          }
          className={`relative z-1 outline-none ${readOnly ? 'cursor-default select-text' : 'cursor-text'} [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold ${className}`}
        />
      </div>

      {!readOnly ? (
        <ReferencePickerPopover
          allowDateUtilities={allowDateUtilities}
          anchorEl={containerRef.current}
          autoFocusSearch={false}
          availableFields={referenceFields}
          fieldGroups={referenceFieldGroups}
          open={referencePickerOpen}
          onClose={closeReferencePicker}
          onSelectField={(field) => insertReferenceToken(createFieldReferenceTokenHtml(field))}
          onSelectCalculation={(calculation) =>
            insertReferenceToken(createCalculationReferenceTokenHtml(calculation))
          }
          onSelectDate={(option: DateReferenceOption, amount?: number) =>
            insertReferenceToken(createDateReferenceTokenHtml(option, amount))
          }
        />
      ) : null}

      {/* Link dialog */}
      <AnimatePresence>
        {!readOnly && linkDialog !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/30"
            onClick={() => { linkDialogOpenRef.current = false; setLinkDialog(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl w-90 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-900 mb-4">Add Link</h3>
              <label className="block text-xs text-gray-500 mb-1">Display text</label>
              <input
                value={linkDialog.text}
                onChange={(e) => setLinkDialog(d => d && { ...d, text: e.target.value })}
                className="w-full border-b border-gray-300 focus:border-primary-500 outline-none pb-1 text-sm mb-4 transition-colors"
              />
              <label className="block text-xs text-gray-500 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                value={linkDialog.url}
                onChange={(e) => setLinkDialog(d => d && { ...d, url: e.target.value })}
                placeholder="https://"
                onKeyDown={(e) => { if (e.key === 'Enter' && linkDialog.url) applyLink() }}
                className="w-full border-b border-gray-300 focus:border-primary-500 outline-none pb-1 text-sm mb-6 transition-colors"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { linkDialogOpenRef.current = false; setLinkDialog(null); }}
                  className="px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyLink}
                  disabled={!linkDialog.url}
                  className="px-4 py-2 text-sm bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-40 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
