import { useState, useCallback, useMemo, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { XIcon } from "@phosphor-icons/react";
import type { FormField, FormSection } from "@/types/form";
import { SortableOptionItem } from "../utils/SortableOptionItem";

type Props = {
  field: FormField;
  sections?: FormSection[];
  hasBranching: boolean;
  openBranchIdx: number | null;
  onOpenBranch: (idx: number | null) => void;
  branchContainerRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  getBranchLabel: (target: string) => string;
  onChange: (updates: Partial<FormField>) => void;
};

export default function OptionsSection({
  field,
  sections,
  hasBranching,
  openBranchIdx,
  onOpenBranch,
  branchContainerRefs,
  getBranchLabel,
  onChange,
}: Props) {
  const [newOption, setNewOption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const optionIds = useMemo(
    () => (field.options ?? []).map((_, i) => `${field.id}-opt-${i}`),
    [field.options, field.id],
  );

  const addOption = useCallback(() => {
    const val = newOption.trim();
    if (!val) return;
    onChange({ options: [...(field.options ?? []), val] });
    setNewOption("");
  }, [newOption, field.options, onChange]);

  const updateOption = useCallback(
    (i: number, value: string) => {
      const old = (field.options ?? [])[i];
      const updated = [...(field.options ?? [])];
      updated[i] = value;
      const changes: Partial<FormField> = { options: updated };
      if (field.optionImages?.[old]) {
        const imgs = { ...field.optionImages };
        imgs[value] = imgs[old];
        delete imgs[old];
        changes.optionImages = imgs;
      }
      if (field.optionImageWidths?.[old]) {
        const widths = { ...field.optionImageWidths };
        widths[value] = widths[old];
        delete widths[old];
        changes.optionImageWidths = widths;
      }
      onChange(changes);
    },
    [field.options, field.optionImages, field.optionImageWidths, onChange],
  );

  const removeOption = useCallback(
    (i: number) => {
      const opt = (field.options ?? [])[i];
      const newOptions = (field.options ?? []).filter((_, idx) => idx !== i);
      const imgs = field.optionImages ? { ...field.optionImages } : undefined;
      if (imgs) delete imgs[opt];
      const widths = field.optionImageWidths ? { ...field.optionImageWidths } : undefined;
      if (widths) delete widths[opt];
      onChange({
        options: newOptions,
        optionImages: Object.keys(imgs ?? {}).length ? imgs : undefined,
        optionImageWidths: Object.keys(widths ?? {}).length ? widths : undefined,
      });
    },
    [field.options, field.optionImages, field.optionImageWidths, onChange],
  );

  const setBranch = useCallback(
    (optionValue: string, target: string) => {
      const branches = { ...(field.branches ?? {}) };
      if (target === "next") delete branches[optionValue];
      else branches[optionValue] = target;
      onChange({ branches: Object.keys(branches).length ? branches : undefined });
    },
    [field.branches, onChange],
  );

  const setOptionImage = useCallback(
    (optionValue: string, url: string) => {
      if (!url) {
        const imgs = { ...field.optionImages };
        delete imgs[optionValue];
        const widths = { ...field.optionImageWidths };
        delete widths[optionValue];
        onChange({
          optionImages: Object.keys(imgs).length ? imgs : undefined,
          optionImageWidths: Object.keys(widths).length ? widths : undefined,
        });
      } else {
        onChange({ optionImages: { ...field.optionImages, [optionValue]: url } });
      }
    },
    [field.optionImages, field.optionImageWidths, onChange],
  );

  const setOptionImageWidth = useCallback(
    (optionValue: string, width: number) => {
      onChange({ optionImageWidths: { ...field.optionImageWidths, [optionValue]: width } });
    },
    [field.optionImageWidths, onChange],
  );

  const handleOptionDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const getIdx = (id: UniqueIdentifier) => parseInt(String(id).split("-opt-").pop()!);
      onChange({ options: arrayMove(field.options ?? [], getIdx(active.id), getIdx(over.id)) });
    },
    [field.options, onChange],
  );

  return (
    <div className="mt-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleOptionDragEnd}>
        <SortableContext items={optionIds} strategy={verticalListSortingStrategy}>
          {(field.options ?? []).map((opt, i) => (
            <SortableOptionItem
              key={`${field.id}-opt-${i}`}
              id={`${field.id}-opt-${i}`}
              index={i}
              value={opt}
              imageUrl={field.optionImages?.[opt]}
              imageWidth={field.optionImageWidths?.[opt]}
              fieldType={field.type}
              hasBranching={hasBranching}
              sections={sections}
              branches={field.branches}
              openBranchIdx={openBranchIdx}
              branchContainerRefs={branchContainerRefs}
              getBranchLabel={getBranchLabel}
              onUpdate={(v) => updateOption(i, v)}
              onRemove={() => removeOption(i)}
              onSetBranch={(target) => setBranch(opt, target)}
              onOpenBranch={onOpenBranch}
              onImageUpload={(url) => setOptionImage(opt, url)}
              onImageResize={(w) => setOptionImageWidth(opt, w)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {field.hasOtherOption && (
        <div className="flex items-center gap-2 py-2">
          {field.type === "multiple_choice" && <div className="w-5 h-5 rounded-full border-2 border-gray-400 shrink-0" />}
          {field.type === "checkbox" && <div className="w-5 h-5 rounded border-2 border-gray-400 shrink-0" />}
          <div className="flex flex-1 items-end gap-2 min-w-0">
            <span className="text-[15px] text-gray-800 shrink-0">Other:</span>
            <div className="flex-1 border-b border-dashed border-gray-300" />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onChange({ hasOtherOption: false }); }}
            className="p-1 text-gray-400 hover:text-gray-600 shrink-0 min-w-7 min-h-7 flex items-center justify-center"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
        {field.type === "multiple_choice" && <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />}
        {field.type === "checkbox" && <div className="w-5 h-5 rounded border-2 border-gray-200 shrink-0" />}
        {field.type === "dropdown" && (
          <span className="text-sm text-gray-300 w-5 shrink-0 text-right">
            {(field.options?.length ?? 0) + 1}.
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); addOption(); } }}
          onClick={(e) => e.stopPropagation()}
          onBlur={addOption}
          placeholder="Add option"
          className="text-[15px] text-gray-500 outline-none bg-transparent hover:[box-shadow:0_1.5px_0_0_#d1d5db] focus:[box-shadow:0_1.5px_0_0_#0054a5] pb-0.5 transition-all flex-1 min-w-0"
        />
        {(field.type === "multiple_choice" || field.type === "checkbox") && !field.hasOtherOption && (
          <>
            <span className="text-[15px] text-gray-400 shrink-0">or</span>
            <button
              onClick={(e) => { e.stopPropagation(); onChange({ hasOtherOption: true }); }}
              className="text-[15px] text-primary-600 hover:underline shrink-0 whitespace-nowrap"
            >
              add &quot;Other&quot;
            </button>
          </>
        )}
      </div>
    </div>
  );
}
