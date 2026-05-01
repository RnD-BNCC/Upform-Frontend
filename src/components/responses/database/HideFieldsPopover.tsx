import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DotsSixVerticalIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { usePopoverClose } from "@/hooks/usePopoverClose";
import type { FormField } from "@/types/form";
import { FIELD_TYPE_META } from "@/components/builder/section/fieldTypeMeta";
import { cleanResultLabel } from "../resultsResponseUtils";

type HideFieldsPopoverProps = {
  fields: FormField[];
  fieldOrder: string[];
  hiddenFieldIds: string[];
  onHiddenChange: (fieldIds: string[]) => void;
  onOrderChange: (fieldIds: string[]) => void;
};

function FieldToggle({
  field,
  hidden,
  onToggle,
}: {
  field: FormField;
  hidden: boolean;
  onToggle: () => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });
  const style = {
    opacity: isDragging ? 0.45 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const meta = FIELD_TYPE_META[field.type];
  const Icon = meta?.Icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex h-10 items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          hidden ? "bg-gray-300" : "bg-gray-900"
        }`}
        aria-label={hidden ? "Show field" : "Hide field"}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            hidden ? "left-0.5 translate-x-0" : "left-0.5 translate-x-4"
          }`}
        />
      </button>
      {Icon ? (
        <Icon size={15} className="shrink-0 text-gray-500" />
      ) : (
        <span className="w-4 shrink-0 text-xs text-gray-500">#</span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">
        {cleanResultLabel(field.label)}
      </span>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
        aria-label="Reorder field"
      >
        <DotsSixVerticalIcon size={16} />
      </button>
    </div>
  );
}

export default function HideFieldsPopover({
  fields,
  fieldOrder,
  hiddenFieldIds,
  onHiddenChange,
  onOrderChange,
}: HideFieldsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = usePopoverClose(open, () => setOpen(false));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const orderedFields = useMemo(() => {
    const byId = new Map(fields.map((field) => [field.id, field]));
    return [
      ...fieldOrder.map((fieldId) => byId.get(fieldId)).filter(Boolean) as FormField[],
      ...fields.filter((field) => !fieldOrder.includes(field.id)),
    ];
  }, [fieldOrder, fields]);

  const filteredFields = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedFields;
    return orderedFields.filter((field) =>
      cleanResultLabel(field.label).toLowerCase().includes(query),
    );
  }, [orderedFields, search]);


  const toggleField = (fieldId: string) => {
    if (hiddenFieldIds.includes(fieldId)) {
      onHiddenChange(hiddenFieldIds.filter((id) => id !== fieldId));
      return;
    }
    onHiddenChange([...hiddenFieldIds, fieldId]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedFields.findIndex((field) => field.id === active.id);
    const newIndex = orderedFields.findIndex((field) => field.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onOrderChange(arrayMove(orderedFields, oldIndex, newIndex).map((field) => field.id));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <EyeSlashIcon size={16} />
        Hide fields
      </button>

      {open ? (
        <div className="absolute left-0 top-12 z-[120] w-[340px] rounded-md border border-gray-200 bg-white shadow-xl">
          <div className="flex h-11 items-center gap-2 border-b border-gray-100 px-3">
            <MagnifyingGlassIcon size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a field"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() =>
                onHiddenChange(
                  hiddenFieldIds.length === fields.length
                    ? []
                    : fields.map((field) => field.id),
                )
              }
              className="shrink-0 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              {hiddenFieldIds.length === fields.length ? "Show all" : "Hide all"}
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedFields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredFields.map((field) => (
                  <FieldToggle
                    key={field.id}
                    field={field}
                    hidden={hiddenFieldIds.includes(field.id)}
                    onToggle={() => toggleField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}
    </div>
  );
}
