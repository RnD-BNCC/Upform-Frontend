import { useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useSortable } from "@dnd-kit/sortable";
import type { FormField } from "@/types/form";
import { FieldPluginLabel } from "./FieldSettingControls";
import DropdownField from "./DropdownField";

const VALIDATION_PATTERNS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number only" },
];

function SortableFieldOptionRow({
  id,
  option,
  onRemove,
  onUpdate,
}: {
  id: string;
  option: string;
  onRemove: () => void;
  onUpdate: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group/option-row flex items-center gap-1.5"
    >
      <button
        type="button"
        {...listeners}
        className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <DotsSixVerticalIcon size={14} weight="bold" />
      </button>
      <input
        type="text"
        value={option}
        onChange={(event) => onUpdate(event.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-300 transition-colors hover:text-red-400"
      >
        <TrashIcon size={12} />
      </button>
    </div>
  );
}

export function FieldPluginOptionsEditor({
  onChange,
  options,
}: {
  onChange: (options: string[]) => void;
  options: string[];
}) {
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const optionIds = options.map((_, index) => `option-${index}`);

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  const addOption = () => {
    onChange([...options, `Option ${options.length + 1}`]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = optionIds.indexOf(String(active.id));
    const newIndex = optionIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(options, oldIndex, newIndex));
  };

  const applyBulk = () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      onChange([...options, ...lines]);
    }

    setBulkText("");
    setShowBulk(false);
  };

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={optionIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {options.map((option, index) => (
              <SortableFieldOptionRow
                key={`option-${index}`}
                id={optionIds[index]}
                option={option}
                onRemove={() => removeOption(index)}
                onUpdate={(value) => updateOption(index, value)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          <PlusIcon size={12} weight="bold" />
          Add option
        </button>
        <span className="text-gray-300">·</span>
        <button
          type="button"
          onClick={() => setShowBulk((value) => !value)}
          className="text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          Bulk add
        </button>
      </div>

      {showBulk ? (
        <div className="mt-1 space-y-1.5">
          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"One option per line\nOption A\nOption B"}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={applyBulk}
            className="w-full rounded-lg bg-primary-500 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Add options
          </button>
        </div>
      ) : null}
    </>
  );
}

export function FieldPluginSelectionValidationFields({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldPluginLabel>Min selections</FieldPluginLabel>
          <input
            type="number"
            value={field.validationMinSelection ?? ""}
            onChange={(event) =>
              onChange({
                validationMinSelection: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            min={0}
            placeholder="0"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
        <div>
          <FieldPluginLabel>Max selections</FieldPluginLabel>
          <input
            type="number"
            value={field.validationMaxSelection ?? ""}
            onChange={(event) =>
              onChange({
                validationMaxSelection: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            min={0}
            placeholder="No limit"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
      </div>
      <div>
        <FieldPluginLabel tooltip="Shown when selection count is outside allowed range">
          Error message
        </FieldPluginLabel>
        <input
          type="text"
          value={field.validationErrorMessage ?? ""}
          onChange={(event) =>
            onChange({
              validationErrorMessage: event.target.value || undefined,
            })
          }
          placeholder="Please select the required number of options"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        />
      </div>
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    </>
  );
}

export function FieldPluginTextValidationFields({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldPluginLabel>Min length</FieldPluginLabel>
          <input
            type="number"
            value={field.validationMinLength ?? ""}
            onChange={(event) =>
              onChange({
                validationMinLength: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            min={0}
            placeholder="0"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
        <div>
          <FieldPluginLabel>Max length</FieldPluginLabel>
          <input
            type="number"
            value={field.validationMaxLength ?? ""}
            onChange={(event) =>
              onChange({
                validationMaxLength: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            min={0}
            placeholder="No limit"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div>
        <FieldPluginLabel>Validation pattern</FieldPluginLabel>
        <DropdownField
          defaultValue={field.validationPattern ?? "none"}
          onChange={(value) =>
            onChange({
              validationEmailDomain:
                value === "email" ? field.validationEmailDomain : undefined,
              validationPattern: value === "none" ? undefined : value,
            })
          }
          options={VALIDATION_PATTERNS}
          size="compact"
        />
      </div>

      {field.validationPattern === "email" ? (
        <div>
          <FieldPluginLabel tooltip="Optional. Example: @binus.ac.id only allows emails ending with that domain. Leave empty to allow any email.">
            Email domain
          </FieldPluginLabel>
          <input
            type="text"
            value={field.validationEmailDomain ?? ""}
            onChange={(event) =>
              onChange({
                validationEmailDomain: event.target.value || undefined,
              })
            }
            placeholder="@binus.ac.id"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
      ) : null}

      <div>
        <FieldPluginLabel tooltip="Shown to the user when their answer fails validation">
          Error message
        </FieldPluginLabel>
        <input
          type="text"
          value={field.validationErrorMessage ?? ""}
          onChange={(event) =>
            onChange({
              validationErrorMessage: event.target.value || undefined,
            })
          }
          placeholder="Please enter a valid value"
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        />
      </div>

      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    </>
  );
}

export function FieldPluginRequiredValidationField({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}) {
  return (
    <div>
      <FieldPluginLabel tooltip="Overrides the default 'This question is required' message">
        Custom required message
      </FieldPluginLabel>
      <input
        type="text"
        value={field.validationMessage ?? ""}
        onChange={(event) =>
          onChange({
            validationMessage: event.target.value || undefined,
          })
        }
        placeholder="This question is required."
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
      />
    </div>
  );
}

export function FieldPluginScaleRangeFields({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <FieldPluginLabel>Min Value</FieldPluginLabel>
        <input
          type="number"
          value={field.scaleMin ?? 1}
          onChange={(event) =>
            onChange({
              scaleMin: Number(event.target.value) || undefined,
            })
          }
          min={0}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
        />
      </div>
      <div>
        <FieldPluginLabel>Max Value</FieldPluginLabel>
        <input
          type="number"
          value={field.scaleMax ?? 10}
          onChange={(event) =>
            onChange({
              scaleMax: Number(event.target.value) || undefined,
            })
          }
          min={1}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
        />
      </div>
      <div>
        <FieldPluginLabel>Min Label</FieldPluginLabel>
        <input
          type="text"
          value={field.minLabel ?? ""}
          onChange={(event) =>
            onChange({ minLabel: event.target.value || undefined })
          }
          placeholder="e.g. Low"
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        />
      </div>
      <div>
        <FieldPluginLabel>Max Label</FieldPluginLabel>
        <input
          type="text"
          value={field.maxLabel ?? ""}
          onChange={(event) =>
            onChange({ maxLabel: event.target.value || undefined })
          }
          placeholder="e.g. High"
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
