import { useState } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField, FormSection } from "@/types/form";
import RichInput from "../utils/RichInput";
import HiddenFieldCard from "./HiddenFieldCard";
import {
  QuestionCardDragHandle,
  QuestionCardFloatingActions,
} from "./QuestionCardActions";
import {
  getAvailableReferenceFieldGroupsForField,
  getAvailableReferenceFieldsForField,
  resolveReferenceHtml,
  resolveReferenceText,
} from "@/utils/form/referenceTokens";
import { getFieldPlugin } from "./fieldRegistry";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  IDR: "Rp",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  SGD: "S$",
  MYR: "RM",
  AUD: "A$",
  CNY: "¥",
  KRW: "₩",
};

type Props = {
  field: FormField;
  sections?: FormSection[];
  sectionType?: "page" | "ending" | "cover";
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings?: () => void;
  onChange: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  accentColor?: string;
};

export default function QuestionCard({
  field,
  sections = [],
  sectionType,
  isSelected,
  onSelect,
  onOpenSettings,
  onChange,
  onDelete,
  onDuplicate,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const [showChangeType, setShowChangeType] = useState(false);
  const availableReferenceFields = getAvailableReferenceFieldsForField(
    sections,
    field.id,
  );
  const availableReferenceFieldGroups = getAvailableReferenceFieldGroupsForField(
    sections,
    field.id,
  );
  const resolvedDescriptionHtml = resolveReferenceHtml(field.description, {
    preserveFallbackLabels: true,
    preserveFallbackTokensAsHtml: true,
  });
  const resolvedDescription = resolveReferenceText(field.description, {
    preserveFallbackLabels: true,
  });
  const resolvedPlaceholder = resolveReferenceText(field.placeholder, {
    preserveFallbackLabels: true,
  });
  const resolvedDefaultValue = resolveReferenceText(field.defaultValue, {
    preserveFallbackLabels: true,
  });
  const resolvedLabelHtml = resolveReferenceHtml(field.label, {
    preserveFallbackLabels: true,
    preserveFallbackTokensAsHtml: true,
  });
  const hasLabelText = !!resolveReferenceText(field.label, {
    preserveFallbackLabels: true,
  }).trim();
  const activeFieldPlugin = getFieldPlugin(field.type);
  const pluginFieldBody = activeFieldPlugin?.renderBuilder?.({
    availableReferenceFieldGroups,
    availableReferenceFields,
    field,
    onChange,
    resolvedDefaultValue,
    resolvedPlaceholder,
    sections,
  });
  const hasPluginFieldBody = pluginFieldBody != null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cardClass = `theme-question-card bg-white rounded-xl cursor-pointer transition-all duration-150 relative ${
    isSelected
      ? "ring-2 ring-primary-400"
      : "hover:ring-2 hover:ring-primary-200"
  }`;
  const showFieldTools = isSelected || showChangeType;
  const wrapperClass = `group relative ${
    showFieldTools ? "z-[60]" : "hover:z-10"
  }`;
  const dragHandle = (
    <QuestionCardDragHandle
      visible={showFieldTools}
      dragProps={listeners as React.HTMLAttributes<HTMLDivElement>}
    />
  );
  const floatingActions = (
    <QuestionCardFloatingActions
      fieldType={field.type}
      isMenuOpen={showChangeType}
      showFieldTools={showFieldTools}
      onChangeType={(type) => onChange({ type })}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onMenuOpenChange={setShowChangeType}
      onOpenSettings={onOpenSettings}
      onSelect={onSelect}
    />
  );
  const pluginFieldCard = activeFieldPlugin?.renderCard?.({
    availableReferenceFieldGroups,
    availableReferenceFields,
    dragHandle,
    dragListeners: listeners as React.HTMLAttributes<HTMLDivElement>,
    field,
    isSelected,
    onChange,
    onSelect,
    resolvedDefaultValue,
    resolvedDescription,
    resolvedDescriptionHtml,
    resolvedLabelHtml,
    resolvedPlaceholder,
    sectionType,
  });
  const hiddenFieldCard = field.hideAlways ? (
    <HiddenFieldCard
      dragHandle={dragHandle}
      hasLabel={Boolean(field.label)}
      isSelected={isSelected}
      labelHtml={resolvedLabelHtml}
      required={field.required}
      onSelect={onSelect}
    />
  ) : null;
  const prioritizedFieldCard = hiddenFieldCard ?? pluginFieldCard;

  if (prioritizedFieldCard) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={wrapperClass}
      >
        {prioritizedFieldCard}
        {floatingActions}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={wrapperClass}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        onClickCapture={onSelect}
        className={`${cardClass}${isSelected ? " z-40" : ""}`}
      >
        <div className="flex">
          {dragHandle}
          <div className="flex-1 py-4 pr-5 min-w-0">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="mb-2">
                <div className="theme-question-title w-full">
                  <span className="inline-flex max-w-full items-start gap-1 align-top">
                    <RichInput
                      value={field.label}
                      onChange={(v) => onChange({ label: v })}
                      placeholder="Type your question here"
                      placeholderClassName="text-xs text-gray-300"
                      referenceFields={availableReferenceFields}
                      referenceFieldGroups={availableReferenceFieldGroups}
                      containerClassName={`inline-block max-w-full align-top ${
                        hasLabelText ? "" : "min-w-48"
                      }`}
                      className="text-sm font-medium border-b-2 border-transparent hover:border-gray-200 focus:border-primary-500 pb-1 transition-colors w-full text-gray-900"
                      stopPropagation
                      noLists
                    />
                    {field.required ? (
                      <span className="pt-0.5 text-sm font-semibold text-red-500">
                        *
                      </span>
                    ) : null}
                  </span>
                </div>
                {resolvedDescriptionHtml && (
                  <div
                    className="theme-question-caption whitespace-pre-wrap text-xs leading-snug text-gray-500"
                    dangerouslySetInnerHTML={{ __html: resolvedDescriptionHtml }}
                  />
                )}
              </div>

              {hasPluginFieldBody ? pluginFieldBody : null}
            </div>
          </div>
        </div>
      </motion.div>
      {floatingActions}
    </div>
  );
}

