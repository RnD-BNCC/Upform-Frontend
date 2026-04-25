import { useState, useEffect } from 'react'
import type { PollSlide, SlideType } from '@/types/polling'
import { ArrowLeft, Plus, Presentation, FloppyDisk, Copy, Trash, DotsSixVertical } from '@phosphor-icons/react'
import { SLIDE_TYPES, TYPE_ICONS } from '@/config/polling'
import type { SlidesSidebarProps } from './types'
import { DndContext, closestCenter, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SlideItemContent({
  slide,
  index,
  isSelected,
  isLiveActive,
  liveQuestion,
  showDelete,
  onDelete,
  elevated = false,
}: {
  slide: PollSlide
  index: number
  isSelected: boolean
  isLiveActive: boolean
  liveQuestion: string | null
  showDelete: boolean
  onDelete?: () => void
  elevated?: boolean
}) {
  return (
    <div
      className={`relative flex flex-col gap-1 rounded-sm px-3 py-2.5 text-left group ${
        elevated
          ? 'bg-white border border-gray-200 shadow-xl'
          : isSelected
            ? 'bg-white border border-primary-300 shadow-sm'
            : 'border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-bold ${isSelected ? 'text-primary-600' : 'text-gray-400'}`}>
          {index + 1}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {TYPE_ICONS[slide.type as SlideType]}
          {SLIDE_TYPES.find((t) => t.value === slide.type)?.label ?? slide.type}
        </span>
      </div>
      <p
        className={`text-xs leading-snug line-clamp-2 ${
          isSelected ? 'text-primary-700 font-medium' : 'text-gray-500'
        }`}
        dangerouslySetInnerHTML={{ __html: (isLiveActive && liveQuestion !== null ? liveQuestion : slide.question) || 'Untitled question' }}
      />
      {showDelete && onDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
        >
          <Trash size={12} weight="bold" />
        </button>
      )}
    </div>
  )
}

function SortableSlideItem({
  slide,
  index,
  isSelected,
  isLiveActive,
  liveQuestion,
  onSelect,
  onDelete,
  showDelete,
}: {
  slide: PollSlide
  index: number
  isSelected: boolean
  isLiveActive: boolean
  liveQuestion: string | null
  onSelect: () => void
  onDelete: () => void
  showDelete: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-stretch gap-0.5">
      <button
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center w-5 shrink-0 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
      >
        <DotsSixVertical size={13} weight="bold" />
      </button>
      <div onClick={onSelect} className="flex-1 cursor-pointer min-w-0">
        <SlideItemContent
          slide={slide}
          index={index}
          isSelected={isSelected}
          isLiveActive={isLiveActive}
          liveQuestion={liveQuestion}
          showDelete={showDelete}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

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
  onReorderSlides,
  saveReorderRef,
  onCopyCode,
  onPresent,
  onSave,
  isAddPending,
}: SlidesSidebarProps) {
  const [localSlides, setLocalSlides] = useState(slides)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocalSlides((prev) => {
      const prevIds = prev.map((s) => s.id)
      const newIds = slides.map((s) => s.id)
      // Same set of IDs (just data update, not add/remove) → preserve local order
      if (prevIds.length === newIds.length && prevIds.every((id) => newIds.includes(id))) {
        return prev.map((s) => slides.find((ss) => ss.id === s.id) ?? s)
      }
      return slides
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [slides])

  useEffect(() => {
    saveReorderRef.current = () => onReorderSlides(localSlides.map((s) => s.id))
  }, [localSlides, onReorderSlides, saveReorderRef])

  const slideIds = localSlides.map((s) => s.id)
  const activeSlideId = slides[selectedIndex]?.id
  const localSelectedIndex = localSlides.findIndex((s) => s.id === activeSlideId)
  const activeSlide = activeId ? localSlides.find((s) => s.id === activeId) : null
  const activeIndex = activeId ? localSlides.findIndex((s) => s.id === activeId) : -1

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localSlides.findIndex((s) => s.id === active.id)
    const newIndex = localSlides.findIndex((s) => s.id === over.id)
    setLocalSlides(arrayMove(localSlides, oldIndex, newIndex))
  }

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50 sm:flex">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
          <ArrowLeft size={16} weight="bold" />
        </button>
        <span className="text-sm font-bold italic text-gray-900">UpForm</span>
      </div>

      <div className="px-4 py-3">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          placeholder="Poll title..."
          className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-gray-200 hover:border-gray-400 focus:border-primary-500 px-0.5 py-1.5 transition-colors placeholder:text-gray-300"
        />
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-4">
        <div className="flex items-center justify-between rounded-sm border border-gray-200 bg-white px-3 py-2">
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
          className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-emerald-500 px-4 text-xs font-bold text-white transition-colors hover:bg-emerald-600"
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
          className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-white px-3 text-xs font-bold text-primary-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={14} weight="bold" />
          New slide
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3">
        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={slideIds} strategy={verticalListSortingStrategy}>
            {localSlides.map((slide, i) => (
              <SortableSlideItem
                key={slide.id}
                slide={slide}
                index={i}
                isSelected={i === localSelectedIndex}
                isLiveActive={slide.id === activeSlideId}
                liveQuestion={liveQuestion}
                onSelect={() => onSelectSlide(slides.findIndex((s) => s.id === slide.id))}
                onDelete={() => onDeleteSlide(slide.id)}
                showDelete={localSlides.length > 1}
              />
            ))}
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
            {activeSlide ? (
              <div style={{ transform: 'rotate(-1deg) scale(1.03)' }}>
                <SlideItemContent
                  slide={activeSlide}
                  index={activeIndex}
                  isSelected={activeIndex === localSelectedIndex}
                  isLiveActive={activeSlide.id === activeSlideId}
                  liveQuestion={liveQuestion}
                  showDelete={false}
                  elevated
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="mt-auto border-t border-gray-100 p-3">
        <button
          onClick={onSave}
          className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-primary-500 px-3 text-xs font-bold text-white transition-colors hover:bg-primary-600"
        >
          <FloppyDisk size={14} weight="bold" />
          Save
        </button>
      </div>
    </aside>
  )
}
