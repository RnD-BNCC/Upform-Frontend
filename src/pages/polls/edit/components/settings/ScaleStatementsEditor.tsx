import { SCALE_COLORS } from '@/config/polling'
import { ColorPickerDropdown } from '@/components/ui'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash, Plus, DotsSixVertical } from '@phosphor-icons/react'

function SortableStatement({ id, value, color, onChange, onColorChange, onBlur, onDelete, canDelete }: {
  id: string
  value: string
  color: string
  onChange: (val: string) => void
  onColorChange: (color: string) => void
  onBlur: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-1.5">
      <ColorPickerDropdown
        value={color}
        onChange={(c) => { onColorChange(c); onBlur() }}
        colors={SCALE_COLORS}
        direction="up"
        align="left"
        showCaret={false}
        swatchSize="sm"
        triggerClassName="h-6 w-6 shrink-0 cursor-pointer rounded-sm border border-gray-200 shadow-sm transition-transform hover:scale-105"
      />
      <div {...listeners} className="shrink-0 cursor-grab rounded-md p-0.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing">
        <DotsSixVertical size={14} weight="bold" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        placeholder="Statement text..."
      />
      {canDelete && (
        <button onClick={onDelete} className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
          <Trash size={14} weight="bold" />
        </button>
      )}
    </div>
  )
}

export default function ScaleStatementsEditor({ statements, colors, onChange, onColorsChange, onBlur }: {
  statements: string[]
  colors: string[]
  onChange: (statements: string[]) => void
  onColorsChange: (colors: string[]) => void
  onBlur: () => void
}) {
  const ids = statements.map((_, i) => `stmt-${i}`)
  const effectiveColors = statements.map((_, i) => colors[i] || SCALE_COLORS[i % SCALE_COLORS.length])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    onChange(arrayMove(statements, oldIndex, newIndex))
    onColorsChange(arrayMove(effectiveColors, oldIndex, newIndex))
    onBlur()
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {statements.map((stmt, i) => (
            <SortableStatement
              key={ids[i]}
              id={ids[i]}
              value={stmt}
              color={effectiveColors[i]}
              onChange={(val) => {
                const next = [...statements]
                next[i] = val
                onChange(next)
              }}
              onColorChange={(c) => {
                const next = [...effectiveColors]
                next[i] = c
                onColorsChange(next)
              }}
              onBlur={onBlur}
              onDelete={() => {
                onChange(statements.filter((_, idx) => idx !== i))
                onColorsChange(effectiveColors.filter((_, idx) => idx !== i))
                onBlur()
              }}
              canDelete={statements.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={() => {
          onChange([...statements, ''])
          onColorsChange([...effectiveColors, SCALE_COLORS[statements.length % SCALE_COLORS.length]])
        }}
        className="mt-1 flex cursor-pointer items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
      >
        <Plus size={12} weight="bold" /> Add statement
      </button>
    </div>
  )
}
