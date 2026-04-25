import { motion } from "framer-motion";
import { CheckCircleIcon } from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import { FieldPluginToggleRow } from "./FieldSettingControls";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { FormField } from "@/types/form";

type ThankYouFieldCardProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  dragHandle: React.ReactNode;
  field: FormField;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: () => void;
};

export function ThankYouFieldCard({
  availableReferenceFieldGroups,
  availableReferenceFields,
  dragHandle,
  field,
  isSelected,
  onChange,
  onSelect,
}: ThankYouFieldCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`relative cursor-pointer rounded-xl bg-transparent transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-primary-400"
          : "hover:ring-2 hover:ring-primary-200"
      }`}
    >
      <div className="flex">
        {dragHandle}
        <div
          className="min-w-0 flex-1 py-6 pr-5 text-center"
          onClick={(event) => event.stopPropagation()}
        >
          {!field.hideIcon && (
            <CheckCircleIcon
              size={40}
              weight="fill"
              className="mx-auto mb-3 text-green-400"
            />
          )}
          <RichInput
            value={field.label}
            onChange={(value) => onChange({ label: value })}
            placeholder="Thank you!"
            referenceFields={availableReferenceFields}
            referenceFieldGroups={availableReferenceFieldGroups}
            placeholderClassName="theme-question-caption text-center text-sm"
            className="theme-question-title w-full border-b border-transparent pb-1 text-center text-xl font-bold text-gray-900 transition-colors hover:border-gray-200 focus:border-primary-400"
            stopPropagation
            noLists
          />
          <input
            type="text"
            value={field.subtitle ?? ""}
            onChange={(event) => {
              event.stopPropagation();
              onChange({ subtitle: event.target.value || undefined });
            }}
            onClick={(event) => event.stopPropagation()}
            placeholder="Thank you for your response!"
            className="theme-question-caption mt-2 w-full border-b border-transparent bg-transparent pb-0.5 text-center text-sm text-gray-500 outline-none transition-colors hover:border-gray-200 focus:border-primary-400 placeholder:text-gray-300"
          />
        </div>
      </div>
    </motion.div>
  );
}

export const thankYouFieldPlugin = createFieldPlugin({
  type: "thank_you_block",
  meta: {
    Icon: CheckCircleIcon,
    iconBg: "bg-green-100 text-green-600",
    label: "Thank You",
  },
  settings: {
    displayOnly: true,
    halfWidth: false,
    logic: false,
  },
  palettes: [
    {
      placement: "ending",
      category: "Content",
      label: "Thank You",
      order: 10,
    },
  ],
  createField: createFieldFactory("thank_you_block", {
    label: "Thank You!",
    required: false,
    subtitle: "Thank you for your response!",
  }),
  renderCard: ({
    availableReferenceFieldGroups,
    availableReferenceFields,
    dragHandle,
    field,
    isSelected,
    onChange,
    onSelect,
  }) => (
    <ThankYouFieldCard
      availableReferenceFieldGroups={availableReferenceFieldGroups}
      availableReferenceFields={availableReferenceFields}
      dragHandle={dragHandle}
      field={field}
      isSelected={isSelected}
      onChange={onChange}
      onSelect={onSelect}
    />
  ),
  renderSettings: ({ field, onChange }) => (
    <FieldPluginToggleRow
      label="Hide icon"
      checked={field.hideIcon ?? false}
      onChange={(value) => onChange({ hideIcon: value || undefined })}
    />
  ),
});
