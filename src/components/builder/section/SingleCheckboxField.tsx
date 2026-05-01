import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckSquareIcon } from "@phosphor-icons/react";
import { SelectionCheckIcon } from "@/components/icons";
import RichInput from "../utils/RichInput";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginRequiredValidationField } from "./FieldSettingSections";
import { FieldPluginToggleRow } from "./FieldSettingControls";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { FormField } from "@/types/form";

type SingleCheckboxFieldCardProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  dragHandle: ReactNode;
  field: FormField;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: HTMLAttributes<HTMLDivElement>["onClickCapture"];
  resolvedDescriptionHtml: string;
};

export function SingleCheckboxFieldCard({
  availableReferenceFieldGroups,
  availableReferenceFields,
  dragHandle,
  field,
  isSelected,
  onChange,
  onSelect,
  resolvedDescriptionHtml,
}: SingleCheckboxFieldCardProps) {
  const isChecked = field.defaultValue === "true";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`theme-question-card relative cursor-pointer rounded-xl bg-white transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-primary-400"
          : "hover:ring-2 hover:ring-primary-200"
      }`}
    >
      <div className="flex">
        {dragHandle}
        <div
          className="flex min-w-0 flex-1 py-4 pr-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className={`theme-answer-input flex w-full items-start gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
              isChecked
                ? "theme-primary-border theme-primary-soft border-primary-400 bg-primary-50"
                : "theme-answer-border border-gray-200 bg-white"
            }`}
          >
            <div
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                isChecked
                  ? "theme-primary-border bg-primary-500"
                  : "theme-answer-border border-gray-300"
              }`}
              style={
                isChecked
                  ? {
                      background: "var(--upform-theme-primary, #0054a5)",
                      borderColor: "var(--upform-theme-primary, #0054a5)",
                    }
                  : undefined
              }
            >
              {isChecked ? <SelectionCheckIcon className="text-white" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1">
                <RichInput
                  value={field.label}
                  onChange={(value) => onChange({ label: value })}
                  placeholder="Type your question here"
                  referenceFields={availableReferenceFields}
                  referenceFieldGroups={availableReferenceFieldGroups}
                  className={`theme-answer-text w-full border-b border-transparent pb-1 text-sm transition-colors hover:border-gray-200 focus:border-primary-400 ${
                    isChecked
                      ? "theme-primary-text font-medium"
                      : "text-gray-700"
                  }`}
                  stopPropagation
                  noLists
                />
                {field.required ? (
                  <span className="pt-0.5 text-sm font-semibold text-red-500">
                    *
                  </span>
                ) : null}
              </div>
              {resolvedDescriptionHtml && (
                <div
                  className="theme-question-caption whitespace-pre-wrap text-xs leading-snug text-gray-500"
                  dangerouslySetInnerHTML={{ __html: resolvedDescriptionHtml }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const singleCheckboxFieldPlugin = createFieldPlugin({
  type: "single_checkbox",
  meta: {
    Icon: CheckSquareIcon,
    iconBg: "bg-orange-100 text-orange-600",
    label: "I agree",
  },
  settings: {
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Choices",
      label: "Single checkbox",
      order: 50,
    },
  ],
  createField: createFieldFactory("single_checkbox", {
    label: "I agree",
    required: false,
  }),
  renderCard: ({
    availableReferenceFieldGroups,
    availableReferenceFields,
    dragHandle,
    field,
    isSelected,
    onChange,
    onSelect,
    resolvedDescriptionHtml,
  }) => (
    <SingleCheckboxFieldCard
      availableReferenceFieldGroups={availableReferenceFieldGroups}
      availableReferenceFields={availableReferenceFields}
      dragHandle={dragHandle}
      field={field}
      isSelected={isSelected}
      onChange={onChange}
      onSelect={onSelect}
      resolvedDescriptionHtml={resolvedDescriptionHtml}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    basic: (
      <FieldPluginToggleRow
        label="Default checked"
        checked={field.defaultValue === "true"}
        onChange={(value) =>
          onChange({ defaultValue: value ? "true" : undefined })
        }
      />
    ),
    validation: (
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    ),
  }),
});
