import { SCALE_COLORS } from '@/config/polling'
import ColorPickerDropdown from '@/components/ui/ColorPickerDropdown'
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
        triggerClassName="w-5 h-5 rounded-full shrink-0 cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-sm"
      />
      <div {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 p-0.5">
        <DotsSixVertical size={14} weight="bold" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
        placeholder="Statement text..."
      />
      {canDelete && (
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1 shrink-0">
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
        className="text-xs text-primary-600 font-bold hover:text-primary-700 self-start mt-1 cursor-pointer flex items-center gap-1"
      >
        <Plus size={12} weight="bold" /> Add statement
      </button>
    </div>
  )
}
