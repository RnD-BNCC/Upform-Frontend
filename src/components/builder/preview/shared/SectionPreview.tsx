import { type MouseEventHandler, type ReactNode, type RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import QuestionCard from "@/components/builder/section";
import type { FormField, FormSection } from "@/types/form";
import { buildRows } from "@/utils/form/formBuilder";
import type { ThemeConfig } from "@/utils/form/themeConfig";
import ThemeFormLayout from "./ThemeFormLayout";

function DroppableSideZone({ id }: { id: string }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`w-12 shrink-0 rounded-lg border-2 border-dashed transition-colors self-stretch min-h-16 ${
        isOver ? "border-primary-400 bg-primary-50" : "border-gray-200"
      }`}
    />
  );
}

function DropIndicator() {
  return (
    <div className="w-full flex items-center gap-2 py-1 pointer-events-none select-none">
      <div className="flex-1 h-0.5 bg-primary-400 rounded-full" />
      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
        +
      </div>
      <div className="flex-1 h-0.5 bg-primary-400 rounded-full" />
    </div>
  );
}

export type SectionPreviewProps = {
  accentColor?: string;
  activeFieldId: string | null;
  contentClassName: string;
  dragInsertIdx: number | null;
  emptyMessage: string;
  pageType: "page" | "ending";
  paletteDragType: string | null;
  paletteInsertIdx: number | null;
  questionsEndRef?: RefObject<HTMLDivElement | null>;
  section: FormSection;
  sections: FormSection[];
  selectedId: string | null;
  themeConfig: ThemeConfig;
  onChangeField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  onImagePositionClick?: MouseEventHandler<HTMLButtonElement>;
  onSelectField: (fieldId: string) => void;
};

export default function SectionPreview({
  accentColor,
  activeFieldId,
  contentClassName,
  dragInsertIdx,
  emptyMessage,
  pageType,
  paletteDragType,
  paletteInsertIdx,
  questionsEndRef,
  section,
  sections,
  selectedId,
  themeConfig,
  onChangeField,
  onDeleteField,
  onDuplicateField,
  onImagePositionClick,
  onSelectField,
}: SectionPreviewProps) {
  const dragField = activeFieldId
    ? section.fields.find((field) => field.id === activeFieldId)
    : null;
  const isDraggingHalf = dragField?.fieldWidth === "half";
  const activeHasPartner = dragField?.rowId
    ? section.fields.some(
        (field) =>
          field.id !== activeFieldId &&
          field.rowId === dragField.rowId &&
          field.fieldWidth === "half",
      )
    : false;

  const renderedFields =
    pageType === "page" &&
    !section.fields.some((field) => field.type !== "next_button")
      ? section.fields.filter((field) => field.type !== "next_button")
      : section.fields;

  const rows = buildRows(renderedFields);
  const elements: ReactNode[] = [];
  let cumulativeIndex = 0;

  for (const row of rows) {
    const getFieldRenderKey = (field: FormField, fieldIdx: number) =>
      field.id || `${pageType}-field-${cumulativeIndex}-${fieldIdx}`;
    const rowKey =
      row.map(getFieldRenderKey).join("+") ||
      `${pageType}-row-${cumulativeIndex}`;

    if (
      (paletteDragType && paletteInsertIdx === cumulativeIndex) ||
      (activeFieldId && dragInsertIdx === cumulativeIndex)
    ) {
      elements.push(<DropIndicator key={`drop-${cumulativeIndex}`} />);
    }

    elements.push(
      <div key={rowKey} className="theme-field-row w-full flex gap-2">
        {row.map((field, fieldIdx) => (
          <div
            key={getFieldRenderKey(field, fieldIdx)}
            className={
              row.length === 2
                ? "flex-1 min-w-0"
                : field.fieldWidth === "half"
                  ? "w-1/2"
                  : "w-full"
            }
          >
            <QuestionCard
              field={field}
              sections={sections}
              sectionType={pageType}
              isSelected={selectedId === field.id}
              onSelect={() => onSelectField(field.id)}
              onOpenSettings={() => onSelectField(field.id)}
              onChange={(updates) => onChangeField(field.id, updates)}
              onDelete={() => onDeleteField(field.id)}
              onDuplicate={() => onDuplicateField(field.id)}
              accentColor={accentColor}
            />
          </div>
        ))}
        {isDraggingHalf &&
          !activeHasPartner &&
          row.length === 1 &&
          row[0].id !== activeFieldId && (
            <DroppableSideZone id={`side-${row[0].id}`} />
          )}
      </div>,
    );

    cumulativeIndex += row.length;
  }

  if (
    (paletteDragType &&
      paletteInsertIdx !== null &&
      paletteInsertIdx >= cumulativeIndex) ||
    (activeFieldId &&
      dragInsertIdx !== null &&
      dragInsertIdx >= cumulativeIndex)
  ) {
    elements.push(<DropIndicator key="drop-end" />);
  }

  const isEmpty =
    pageType === "page"
      ? section.fields.filter((field) => field.type !== "next_button").length ===
        0
      : section.fields.length === 0;

  return (
    <ThemeFormLayout
      formEndRef={questionsEndRef}
      pageType={pageType}
      surfaceClassName={contentClassName}
      themeConfig={themeConfig}
      onFormClick={(event) => event.stopPropagation()}
      onImagePositionClick={onImagePositionClick}
    >
      <SortableContext
        items={section.fields.map((field) => field.id)}
        strategy={verticalListSortingStrategy}
      >
        <AnimatePresence>{elements}</AnimatePresence>
      </SortableContext>

      {isEmpty && (
        <div className="py-8 text-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      )}
    </ThemeFormLayout>
  );
}
