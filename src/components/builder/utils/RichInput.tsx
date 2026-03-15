import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LinkSimpleIcon, ListBulletsIcon, ListNumbersIcon } from '@phosphor-icons/react'

const isEmpty = (html: string) =>
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

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  stopPropagation?: boolean
  noLists?: boolean
}

export default function RichInput({
  value,
  onChange,
  placeholder,
  className = '',
  stopPropagation,
  noLists,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)
  const lastValueRef = useRef(value)
  const undoStackRef = useRef<string[]>([])
  const redoStackRef = useRef<string[]>([])
  const [showToolbar, setShowToolbar] = useState(false)
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false })
  const [linkDialog, setLinkDialog] = useState<{ text: string; url: string } | null>(null)
  const linkDialogOpenRef = useRef(false)
  const savedRangeRef = useRef<Range | null>(null)

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value
  }, []) // mount only

  useEffect(() => {
    if (!focusedRef.current && ref.current && lastValueRef.current !== value) {
      ref.current.innerHTML = value
    }
    lastValueRef.current = value
  }, [value])

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
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
      lastValueRef.current = ref.current.innerHTML
      onChange(ref.current.innerHTML)
    }
    updateActiveFormats()
  }

  const toggleList = useCallback((type: 'ul' | 'ol') => {
    if (!ref.current) return
    if (document.activeElement !== ref.current) ref.current.focus()
    pushUndoSnapshot()
    const sel = window.getSelection()
    if (!sel) return

    // Find if cursor is already inside a list
    let listNode: Element | null = null
    let n: Node | null = sel.rangeCount > 0 ? sel.getRangeAt(0).startContainer : null
    while (n && n !== ref.current) {
      if (n instanceof Element && (n.tagName === 'UL' || n.tagName === 'OL')) { listNode = n; break }
      n = n.parentNode
    }

    if (listNode) {
      if (listNode.tagName === type.toUpperCase()) {
        // Same type → toggle off: unwrap items to flat content
        const frag = document.createDocumentFragment()
        listNode.querySelectorAll('li').forEach((li, i) => {
          if (i > 0) frag.appendChild(document.createElement('br'))
          li.childNodes.forEach((c) => frag.appendChild(c.cloneNode(true)))
        })
        listNode.replaceWith(frag)
      } else {
        // Different type → convert list type, keep items
        const newList = document.createElement(type)
        newList.innerHTML = listNode.innerHTML
        listNode.replaceWith(newList)
        const lastLi = newList.querySelector('li:last-child')
        if (lastLi) {
          const range = document.createRange()
          range.selectNodeContents(lastLi)
          range.collapse(false)
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
    } else {
      // Toggle on: split content by <br> and block elements, each becomes an <li>
      const list = document.createElement(type)
      const children = Array.from(ref.current.childNodes)
      let li = document.createElement('li')

      const pushLi = () => {
        if (!li.childNodes.length) li.appendChild(document.createElement('br'))
        list.appendChild(li)
        li = document.createElement('li')
      }

      children.forEach((child) => {
        if (child.nodeName === 'BR') {
          pushLi()
        } else if (child instanceof Element && /^(DIV|P|H[1-6])$/.test(child.tagName)) {
          child.childNodes.forEach((c) => li.appendChild(c.cloneNode(true)))
          pushLi()
        } else {
          li.appendChild(child.cloneNode(true))
        }
      })
      if (li.childNodes.length || !list.children.length) pushLi()

      ref.current.innerHTML = ''
      ref.current.appendChild(list)

      // Place cursor in last li
      const lastLi = list.querySelector('li:last-child')
      if (lastLi) {
        const range = document.createRange()
        range.selectNodeContents(lastLi)
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }

    lastValueRef.current = ref.current.innerHTML
    onChange(ref.current.innerHTML)
    updateActiveFormats()
  }, [onChange, updateActiveFormats, pushUndoSnapshot])

  const startListAtCursor = useCallback((type: 'ul' | 'ol') => {
    if (!ref.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    // Walk up to find the direct child of contenteditable containing the cursor
    let node: Node = range.startContainer
    while (node.parentNode !== ref.current) {
      if (!node.parentNode) return
      node = node.parentNode
    }
    // If cursor is already inside a list, convert/toggle it
    if (node instanceof Element && (node.tagName === 'UL' || node.tagName === 'OL')) {
      toggleList(type)
      return
    }
    // Replace only the current block/text-node with a new list
    pushUndoSnapshot()
    const list = document.createElement(type)
    const li = document.createElement('li')
    if (node instanceof Element) {
      node.childNodes.forEach((c) => li.appendChild(c.cloneNode(true)))
    } else if (node.textContent) {
      li.appendChild(node.cloneNode(true))
    }
    if (!li.childNodes.length) li.appendChild(document.createElement('br'))
    list.appendChild(li)
    node.replaceWith(list)
    const r = document.createRange()
    r.selectNodeContents(li)
    r.collapse(false)
    sel.removeAllRanges()
    sel.addRange(r)
    lastValueRef.current = ref.current.innerHTML
    onChange(ref.current.innerHTML)
    updateActiveFormats()
  }, [toggleList, onChange, updateActiveFormats, pushUndoSnapshot])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (stopPropagation) e.stopPropagation()

    // Undo / Redo for list operations
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
    setShowToolbar(false)
    savedRangeRef.current = null
  }

  const fmtBtn = (active: boolean, label: React.ReactNode, cmd: string, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); execFormat(cmd) }}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
        active ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div className="relative">
        {isEmpty(value) && !showToolbar && (
          <span className="absolute inset-0 text-gray-400 pointer-events-none leading-normal select-none">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
          onKeyDown={handleKeyDown}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={(e) => {
            e.preventDefault()
            const html = e.clipboardData.getData('text/html')
            if (html) {
              document.execCommand('insertHTML', false, sanitizePaste(html))
            } else {
              document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
            }
            if (ref.current) {
              lastValueRef.current = ref.current.innerHTML
              onChange(ref.current.innerHTML)
            }
          }}
          onInput={() => {
            if (ref.current) {
              lastValueRef.current = ref.current.innerHTML
              onChange(ref.current.innerHTML)
            }
          }}
          onFocus={() => { focusedRef.current = true; setShowToolbar(true); updateActiveFormats() }}
          onBlur={() => {
            focusedRef.current = false
            if (!linkDialogOpenRef.current) setShowToolbar(false)
          }}
          className={`outline-none cursor-text [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:leading-normal ${className}`}
        />
      </div>

      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-0.5 mt-1.5"
          >
            {fmtBtn(activeFormats.bold, <span className="text-[15px] font-black font-sans">B</span>, 'bold')}
            {fmtBtn(activeFormats.italic, <span className="text-[15px] italic">I</span>, 'italic')}
            {fmtBtn(activeFormats.underline, <span className="text-[15px] underline">U</span>, 'underline')}
            <button
              type="button"
              title="Insert link"
              onMouseDown={handleLinkMouseDown}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <LinkSimpleIcon size={14} />
            </button>
            {!noLists && (
              <>
                <button
                  type="button"
                  title="Bulleted list"
                  onMouseDown={(e) => { e.preventDefault(); startListAtCursor('ul') }}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <ListBulletsIcon size={15} />
                </button>
                <button
                  type="button"
                  title="Numbered list"
                  onMouseDown={(e) => { e.preventDefault(); startListAtCursor('ol') }}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <ListNumbersIcon size={15} />
                </button>
              </>
            )}
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              type="button"
              title="Clear formatting"
              onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat') }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded transition-colors"
            >
              <span className="text-[15px]">T<sub className="text-[9px]">x</sub></span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {linkDialog !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/30"
            onClick={() => { linkDialogOpenRef.current = false; setLinkDialog(null); setShowToolbar(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl w-90 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-900 mb-4">Tambahkan Link</h3>
              <label className="block text-xs text-gray-500 mb-1">Teks yang akan ditampilkan</label>
              <input
                value={linkDialog.text}
                onChange={(e) => setLinkDialog(d => d && { ...d, text: e.target.value })}
                className="w-full border-b border-gray-300 focus:border-primary-500 outline-none pb-1 text-sm mb-4 transition-colors"
              />
              <label className="block text-xs text-gray-500 mb-1">
                Link ke <span className="text-red-500">*</span>
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
                  onClick={() => { linkDialogOpenRef.current = false; setLinkDialog(null); setShowToolbar(false) }}
                  className="px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={applyLink}
                  disabled={!linkDialog.url}
                  className="px-4 py-2 text-sm bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-40 transition-colors"
                >
                  Oke
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
