import { motion } from 'framer-motion'
import type { SlideType } from '@/types/polling'
import { ArrowLeft, Plus, Presentation, FloppyDisk, Copy, Trash } from '@phosphor-icons/react'
import { SLIDE_TYPES, TYPE_ICONS } from '@/config/polling'
import type { SlidesSidebarProps } from './types'

export default function SlidesSidebar({
  title,
  pollCode,
  slides,
  selectedIndex,
  liveQuestion,
  onBack,
  onTitleChange,
  onTitleBlur,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onCopyCode,
  onPresent,
  onSave,
  isAddPending,
}: SlidesSidebarProps) {
  return (
    <aside className="hidden sm:flex w-64 bg-white border-r border-gray-100 flex-col h-screen sticky top-0 shrink-0 overflow-y-auto">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
          <ArrowLeft size={16} weight="bold" />
        </button>
        <span className="text-sm font-bold italic text-gray-900">UpForm</span>
      </div>

      <div className="px-4 pb-3">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          placeholder="Poll title..."
          className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-gray-200 hover:border-gray-400 focus:border-primary-500 px-0.5 py-1.5 transition-colors placeholder:text-gray-300"
        />
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="font-medium">Code:</span>
            <span className="font-bold text-gray-800 tracking-wider">{pollCode}</span>
          </div>
          <button onClick={onCopyCode} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer" title="Copy code">
            <Copy size={13} weight="bold" />
          </button>
        </div>
        <button
          onClick={onPresent}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
        >
          <Presentation size={14} weight="bold" />
          Present
        </button>
      </div>

      <div className="border-t border-gray-100" />

      <div className="p-3">
        <button
          onClick={onAddSlide}
          disabled={isAddPending}
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
            onClick={() => onSelectSlide(i)}
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
                onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id) }}
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
          onClick={onSave}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <FloppyDisk size={14} weight="bold" />
          Save
        </button>
      </div>
    </aside>
  )
}
