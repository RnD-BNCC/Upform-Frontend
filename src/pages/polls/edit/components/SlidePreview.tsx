import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SlideType, SlideSettings, ImageLayout } from '@/types/polling'
import { TOOLBAR_COLORS, FORMAT_CMDS, SCALE_COLORS, GRID_DOT_POSITIONS } from '@/config/polling'
import CaretIcon from '@/components/ui/CaretIcon'
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  ThumbsUp,
  ArrowDown,
} from '@phosphor-icons/react'

export default function SlidePreview({
  code,
  question,
  options,
  type,
  settings,
  onQuestionChange,
  onQuestionBlur,
}: {
  code: string
  question: string
  options: string[]
  type: SlideType
  settings: SlideSettings
  onQuestionChange: (val: string) => void
  onQuestionBlur: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)

  const currentHtmlRef = useRef(question)
  const onChangeRef = useRef(onQuestionChange)
  const onBlurRef = useRef(onQuestionBlur)
  onChangeRef.current = onQuestionChange
  onBlurRef.current = onQuestionBlur

  useEffect(() => {
    if (!editing && editorRef.current) {
      editorRef.current.innerHTML = question
      currentHtmlRef.current = question
    }
  }, [question, editing])

  useEffect(() => {
    if (!editing || !editorRef.current) return
    if (counterRef.current) {
      counterRef.current.textContent = String(editorRef.current.innerText.length)
    }
    editorRef.current.focus()
    const sel = window.getSelection()
    if (sel) {
      sel.selectAllChildren(editorRef.current)
      sel.collapseToEnd()
    }
  }, [editing])

  const syncFormatButtons = useCallback(() => {
    if (!containerRef.current) return
    FORMAT_CMDS.forEach((cmd) => {
      const el = containerRef.current!.querySelector(`[data-cmd="${cmd}"]`) as HTMLElement | null
      if (!el) return
      const active = document.queryCommandState(cmd)
      if (active) {
        el.classList.add('bg-primary-100', 'text-primary-600')
        el.classList.remove('text-gray-500')
      } else {
        el.classList.remove('bg-primary-100', 'text-primary-600')
        el.classList.add('text-gray-500')
      }
    })
  }, [])

  useEffect(() => {
    if (!editing) return
    const handler = () => syncFormatButtons()
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [editing, syncFormatButtons])

  useEffect(() => {
    if (!showColorPicker) return
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColorPicker])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    currentHtmlRef.current = editorRef.current.innerHTML
    if (counterRef.current) {
      counterRef.current.textContent = String(editorRef.current.innerText.length)
    }
  }, [])

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) return
    const html = currentHtmlRef.current
    setEditing(false)
    setShowColorPicker(false)
    onChangeRef.current(html)
    onBlurRef.current(html)
  }, [])

  const execCmd = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleInput()
    syncFormatButtons()
  }, [handleInput, syncFormatButtons])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); execCmd('bold'); break
        case 'i': e.preventDefault(); execCmd('italic'); break
        case 'u': e.preventDefault(); execCmd('underline'); break
      }
    }
  }, [execCmd])

  const joinUrl = `${window.location.origin}/live`
  const imageUrl = settings.imageUrl
  const imageLayout: ImageLayout = settings.imageLayout ?? 'above'
  const showInstructions = settings.showInstructionsBar !== false

  const questionEditor = (
    <div className="mb-4" ref={containerRef}>
      <div
        className="rounded-lg cursor-text transition-shadow px-4 py-3 relative"
        style={{ boxShadow: editing ? '0 0 0 2px #818cf8' : undefined }}
        onMouseEnter={(e) => { if (!editing) e.currentTarget.style.boxShadow = '0 0 0 2px #818cf8' }}
        onMouseLeave={(e) => { if (!editing) e.currentTarget.style.boxShadow = 'none' }}
        onClick={() => { if (!editing) setEditing(true) }}
      >
        <div
          ref={editorRef}
          contentEditable={editing ? true : undefined}
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full text-xl font-bold bg-transparent outline-none min-h-12 text-center empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:italic empty:before:font-medium"
          data-placeholder="Type your question here..."
          style={{ color: settings.textColor ?? '#111827' }}
        />
        {editing && (
          <span
            ref={counterRef}
            className="absolute top-2 right-2 text-[10px] font-semibold text-white bg-primary-400 rounded-full w-7 h-5 flex items-center justify-center"
          >
            0
          </span>
        )}
      </div>
      {editing && (
        <div className="flex items-center gap-0.5 px-1 pt-2" onMouseDown={(e) => e.preventDefault()}>
          <button
            onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat') }}
            className="text-[11px] text-gray-500 font-medium px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
          >
            Default <CaretIcon />
          </button>
          <div className="relative" ref={colorPickerRef}>
            <div
              onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(!showColorPicker) }}
              className="w-5 h-5 rounded-full bg-gray-800 ml-1 cursor-pointer border-2 border-gray-200 hover:scale-110 transition-transform"
              title="Text color"
            />
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl z-50 p-2"
                >
                  <div className="grid grid-cols-5 gap-1.5">
                    {TOOLBAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onMouseDown={(e) => { e.preventDefault(); execCmd('foreColor', c); setShowColorPicker(false) }}
                        className="w-5 h-5 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-px h-4 bg-gray-200 mx-1.5" />
          {[
            { icon: <TextB size={15} weight="bold" />, title: 'Bold', cmd: 'bold' },
            { icon: <TextItalic size={15} />, title: 'Italic', cmd: 'italic' },
            { icon: <TextUnderline size={15} />, title: 'Underline', cmd: 'underline' },
            { icon: <TextStrikethrough size={15} />, title: 'Strikethrough', cmd: 'strikethrough' },
          ].map((btn) => (
            <button
              key={btn.title}
              title={btn.title}
              data-cmd={btn.cmd}
              onMouseDown={(e) => { e.preventDefault(); execCmd(btn.cmd) }}
              className="p-1.5 rounded cursor-pointer transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              {btn.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const vizArea = (
    <>
      {['multiple_choice', 'ranking'].includes(type) && (
        <div className="flex flex-col gap-3 mt-auto px-2">
          {options.map((opt, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: settings.textColor ?? '#111827' }}>
                  {opt || `Option ${i + 1}`}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: settings.textColor ?? '#111827', opacity: 0.5 }}>
                  0%
                </span>
              </div>
              <div className="h-6 rounded-md" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />
            </div>
          ))}
        </div>
      )}
      {type === 'word_cloud' && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Word cloud responses will appear here</div>
      )}
      {type === 'open_ended' && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Open-ended responses will appear here</div>
      )}
      {type === 'scales' && options.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-auto px-2 w-full">
          {options.map((stmt, i) => {
            const color = settings.scaleColors?.[i] || SCALE_COLORS[i % SCALE_COLORS.length]
            return (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold truncate" style={{ color: settings.textColor ?? '#111827' }}>
                  {stmt || `Statement ${i + 1}`}
                </span>
                <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                  <div className="h-full rounded-full" style={{ backgroundColor: color, width: '0%' }} />
                </div>
              </div>
            )
          })}
          <div className="flex justify-between mt-0.5">
            <span className="text-[8px] text-gray-400">{settings.scaleMinLabel || 'Strongly disagree'}</span>
            <span className="text-[8px] text-gray-400">{settings.scaleMaxLabel || 'Strongly agree'}</span>
          </div>
        </div>
      )}
      {type === 'scales' && options.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Add statements to preview</div>
      )}
      {type === 'ranking' && options.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Add options to preview ranking</div>
      )}
      {type === 'qa' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-[9px] font-semibold text-gray-400 tabular-nums">0/0 answered</p>
          <p className="text-sm font-bold text-center leading-snug" style={{ color: settings.textColor ?? '#111827' }}>Sample question from audience</p>
          <div className="flex items-center gap-1" style={{ color: settings.textColor ?? '#111827', opacity: 0.35 }}>
            <ThumbsUp size={10} weight="fill" />
            <span className="text-[9px] font-medium">0</span>
          </div>
          <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center mt-2">
            <ArrowDown size={8} weight="bold" className="text-gray-400" />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-gray-800 text-white">ENTER</span>
            <span className="text-[7px] text-gray-400">to mark as answered</span>
          </div>
        </div>
      )}
      {type === 'guess_number' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
          <div className="text-2xl font-black text-primary-400 tabular-nums">{settings.correctNumber ?? '?'}</div>
          <div className="w-full h-2 rounded-full bg-gray-100 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1/2 rounded-full bg-primary-200" />
          </div>
          <div className="flex justify-between w-full">
            <span className="text-[10px] text-gray-300">{settings.numberMin ?? 0}</span>
            <span className="text-[10px] text-gray-300">{settings.numberMax ?? 10}</span>
          </div>
        </div>
      )}
      {type === 'hundred_points' && options.length > 0 && (
        <div className="flex flex-col gap-2 mt-auto px-2">
          {options.slice(0, 4).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 truncate">{opt || `Option ${i + 1}`}</span>
              <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-primary-200" style={{ width: `${(4 - i) * 20}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {type === 'hundred_points' && options.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Add options to preview</div>
      )}
      {type === 'pin_on_image' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          {settings.imageUrl ? (
            <div className="relative w-full max-h-40 overflow-hidden rounded-lg">
              <img src={settings.imageUrl} alt="" className="w-full object-cover rounded-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 rounded-lg px-2 py-1 text-[10px] text-gray-500 font-medium">Audience will pin here</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-300 text-sm text-center">Upload an image above<br />to enable pinning</div>
          )}
        </div>
      )}
      {type === 'grid_2x2' && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="relative aspect-square w-full max-w-36 border border-gray-200 rounded-lg bg-gray-50">
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <div className="w-full h-px bg-gray-200" />
            </div>
            <div className="absolute inset-0 flex justify-center pointer-events-none">
              <div className="h-full w-px bg-gray-200" />
            </div>
            <span className="absolute bottom-1 right-1.5 text-[8px] text-gray-300">{settings.axisXLabel || 'X'} →</span>
            <span className="absolute top-1 left-1.5 text-[8px] text-gray-300">↑ {settings.axisYLabel || 'Y'}</span>
            {options.slice(0, 4).map((_opt, i) => {
              const pos = GRID_DOT_POSITIONS[i]
              return (
                <div key={i} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
                  <div className="w-3 h-3 rounded-full bg-primary-400 border border-white shadow-sm" />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )

  const imageEl = imageUrl ? (
    <img src={imageUrl} alt="" className="w-full h-full object-contain rounded-lg" />
  ) : null

  return (
    <div className="border-2 border-dashed border-primary-300 rounded-2xl p-3 bg-gray-50/50">
      <div
        className="bg-white rounded-xl shadow-sm relative"
        style={{ backgroundColor: settings.bgColor }}
      >
        <div className="absolute top-2.5 right-3 z-10">
          <span className="text-[10px] font-bold italic text-primary-500">UpForm</span>
        </div>

        {showInstructions && (
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="flex items-center gap-1 text-gray-500 text-[9px] font-medium bg-gray-100 rounded-full px-3 py-1">
              <span>Join at <span className="font-semibold text-gray-700">{joinUrl}</span></span>
              <span className="text-gray-300">|</span>
              <span>use code</span>
              <span className="text-gray-900 font-bold tracking-wider text-[10px]">{code}</span>
            </div>
          </div>
        )}

        <div className="px-6 py-5 min-h-72 flex flex-col">
          {imageUrl && imageLayout === 'full' && (
            <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
              <img src={imageUrl} alt="" className="w-full h-full object-cover opacity-30" />
            </div>
          )}

          <div className="relative z-1 flex flex-col flex-1">
            {imageUrl && imageLayout === 'above' && (
              <div className="flex justify-center mb-4">
                <div className="max-h-40 max-w-full overflow-hidden rounded-lg">
                  {imageEl}
                </div>
              </div>
            )}

            {imageUrl && ['left', 'right', 'left-large', 'right-large'].includes(imageLayout) ? (
              <div className={`flex gap-4 flex-1 ${imageLayout === 'right' || imageLayout === 'right-large' ? 'flex-row-reverse' : ''}`}>
                <div className={`${imageLayout.includes('large') ? 'w-3/5' : 'w-2/5'} shrink-0 flex items-start`}>
                  <div className="w-full max-h-52 overflow-hidden rounded-lg">
                    {imageEl}
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  {questionEditor}
                  {vizArea}
                </div>
              </div>
            ) : (
              <>
                {questionEditor}
                {vizArea}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100">
          {imageUrl && (
            <span className="text-[10px] font-medium text-gray-400">The slide image appears in your audience's devices</span>
          )}
          <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
            <span className="text-[10px] font-medium">QR code visible while presenting</span>
          </div>
        </div>
      </div>
    </div>
  )
}

