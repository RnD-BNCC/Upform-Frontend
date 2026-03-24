import { ArrowLeft, Plus, Presentation, FloppyDisk } from '@phosphor-icons/react'
import { SLIDE_TYPES } from '@/config/polling'
import type { MobileSlideNavProps } from './types'

export default function MobileSlideNav({
  title,
  slides,
  selectedIndex,
  onBack,
  onTitleChange,
  onTitleBlur,
  onSelectSlide,
  onAddSlide,
  onPresent,
  onSave,
  isAddPending,
}: MobileSlideNavProps) {
  return (
    <>
      <header className="sm:hidden fixed top-0 left-0 right-0 bg-primary-800 z-50 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-white/60 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft size={18} weight="bold" />
        </button>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          placeholder="Poll title..."
          className="text-sm font-semibold text-white bg-transparent outline-none flex-1 placeholder:text-white/40"
        />
        <button
          onClick={onPresent}
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
            onClick={() => onSelectSlide(i)}
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
          onClick={onAddSlide}
          disabled={isAddPending}
          className="shrink-0 w-7 h-7 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>

      <button
        onClick={onSave}
        className="sm:hidden fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <FloppyDisk size={20} weight="bold" />
      </button>
    </>
  )
}
