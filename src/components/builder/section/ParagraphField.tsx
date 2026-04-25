import {
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { TextAlignLeftIcon } from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { FormField } from "@/types/form";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
};

export default function ParagraphField({
  placeholder,
  defaultValue,
  hasError = false,
  onChange,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resizeTextarea();
  }, [defaultValue]);

  return (
    <textarea
      ref={textareaRef}
      value={defaultValue ?? ""}
      onChange={(e) => {
        onChange(e.target.value);
        resizeTextarea();
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      placeholder={placeholder || "Long answer..."}
      rows={3}
      className={`theme-answer-input theme-answer-multiline w-full min-h-16 resize-none overflow-hidden rounded-lg border bg-transparent px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors ${
        hasError
          ? "border-red-400 focus:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus:border-primary-400"
      } placeholder:text-gray-300 placeholder:text-xs`}
    />
  );
}

type ParagraphBlockFieldCardProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  defaultValue?: string;
  dragHandle: ReactNode;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: HTMLAttributes<HTMLDivElement>["onClickCapture"];
  placeholder?: string;
};

export function ParagraphBlockFieldCard({
  availableReferenceFieldGroups,
  availableReferenceFields,
  defaultValue,
  dragHandle,
  isSelected,
  onChange,
  onSelect,
  placeholder,
}: ParagraphBlockFieldCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`cursor-pointer rounded-xl bg-transparent transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-primary-400"
          : "hover:ring-2 hover:ring-primary-200"
      }`}
    >
      <div className="flex">
        {dragHandle}
        <div
          className="min-w-0 flex-1 py-4 pr-5 text-xs"
          onClick={(event) => event.stopPropagation()}
        >
          <RichInput
            value={defaultValue ?? ""}
            onChange={(value) => onChange({ defaultValue: value || undefined })}
            placeholder={placeholder || "Write paragraph content here..."}
            referenceFields={availableReferenceFields}
            referenceFieldGroups={availableReferenceFieldGroups}
            placeholderClassName="theme-question-caption text-sm"
            className="theme-question-caption w-full border-b border-transparent pb-1 text-sm text-gray-700 transition-colors hover:border-gray-200 focus:border-primary-400"
            stopPropagation
          />
        </div>
      </div>
    </motion.div>
  );
}

export const longTextFieldPlugin = createFieldPlugin({
  type: "long_text",
  meta: {
    Icon: TextAlignLeftIcon,
    iconBg: "bg-green-100 text-green-600",
    label: "Long answer",
    similarTypes: ["short_text", "rich_text"],
  },
  settings: {
    caption: true,
    defaultValue: true,
    halfWidth: true,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Text",
      label: "Long answer",
      order: 20,
    },
  ],
  createField: createFieldFactory("long_text", {
    label: "Question",
    required: false,
  }),
  renderBuilder: ({ onChange, resolvedDefaultValue, resolvedPlaceholder }) => (
    <ParagraphField
      placeholder={resolvedPlaceholder}
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});

export const paragraphBlockFieldPlugin = createFieldPlugin({
  type: "paragraph",
  meta: {
    Icon: TextAlignLeftIcon,
    iconBg: "bg-gray-100 text-gray-500",
    label: "Paragraph",
  },
  settings: {
    caption: true,
    defaultValue: true,
    displayOnly: true,
    halfWidth: true,
    logic: false,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Display text",
      label: "Paragraph",
      order: 20,
    },
    {
      placement: "ending",
      category: "Content",
      label: "Paragraph",
      order: 40,
    },
  ],
  createField: createFieldFactory("paragraph", {
    label: "Paragraph",
    required: false,
  }),
  renderCard: ({
    availableReferenceFieldGroups,
    availableReferenceFields,
    dragHandle,
    isSelected,
    onChange,
    onSelect,
    resolvedDefaultValue,
    resolvedPlaceholder,
  }) => (
    <ParagraphBlockFieldCard
      availableReferenceFieldGroups={availableReferenceFieldGroups}
      availableReferenceFields={availableReferenceFields}
      defaultValue={resolvedDefaultValue}
      dragHandle={dragHandle}
      isSelected={isSelected}
      onChange={onChange}
      onSelect={onSelect}
      placeholder={resolvedPlaceholder}
    />
  ),
});
