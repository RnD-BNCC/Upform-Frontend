import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortAscendingIcon } from "@phosphor-icons/react";
import type { DragEndEvent } from "@dnd-kit/core";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import {
  FieldPluginOptionsEditor,
  FieldPluginRequiredValidationField,
} from "./FieldSettingSections";

const DEFAULT_RANKING_OPTIONS = ["Option 1", "Option 2"];

type RankingItemProps = {
  id: string;
  index: number;
  label: string;
};

function RankingFieldItem({ id, index, label }: RankingItemProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="theme-answer-input theme-answer-border flex cursor-grab touch-none items-center gap-2 rounded-lg border bg-white px-3 py-2 active:cursor-grabbing"
    >
      <span className="theme-answer-placeholder w-4 shrink-0 text-xs font-bold text-gray-300">
        {index + 1}
      </span>
      <div className="theme-answer-text flex-1 text-sm text-gray-500">
        {label}
      </div>
    </div>
  );
}

type Props = {
  onChange: (options: string[]) => void;
  options: string[];
};

export default function RankingField({ onChange, options }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = options.indexOf(active.id as string);
    const newIndex = options.indexOf(over.id as string);
    onChange(arrayMove(options, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={options} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {options.map((option, index) => (
            <RankingFieldItem
              key={option}
              id={option}
              index={index}
              label={option}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export const rankingFieldPlugin = createFieldPlugin({
  type: "ranking",
  meta: {
    Icon: SortAscendingIcon,
    iconBg: "bg-orange-100 text-orange-600",
    label: "Ranking",
  },
  settings: {
    caption: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Rating & Ranking",
      label: "Ranking",
      order: 10,
    },
  ],
  createField: createFieldFactory("ranking", {
    label: "Ranking",
    options: DEFAULT_RANKING_OPTIONS,
    required: false,
  }),
  renderBuilder: ({ field, onChange }) => (
    <RankingField
      options={
        field.options?.length ? field.options : DEFAULT_RANKING_OPTIONS
      }
      onChange={(options) => onChange({ options })}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    options: (
      <FieldPluginOptionsEditor
        options={field.options?.length ? field.options : DEFAULT_RANKING_OPTIONS}
        onChange={(options) => onChange({ options })}
      />
    ),
    validation: (
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    ),
  }),
});
