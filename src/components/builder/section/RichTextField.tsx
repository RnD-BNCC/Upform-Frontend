import { TextAaIcon } from "@phosphor-icons/react";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import RichInput from "../utils/RichInput";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import type { FormField } from "@/types/form";

type Props = {
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  referenceFieldGroups?: ConditionFieldGroup[];
  referenceFields?: FormField[];
  showToolbar?: boolean;
};

export default function RichTextField({
  defaultValue,
  onChange,
  placeholder,
  readOnly = false,
  referenceFieldGroups = [],
  referenceFields = [],
  showToolbar = true,
}: Props) {
  return (
    <div className="theme-answer-input overflow-hidden rounded-lg border border-gray-200 bg-white">
      <RichInput
        value={defaultValue ?? ""}
        onChange={(value) => onChange(value)}
        placeholder={placeholder ?? "Write something here..."}
        placeholderClassName="theme-answer-placeholder px-3 py-2.5 text-xs text-gray-300"
        readOnly={readOnly}
        referenceFields={referenceFields}
        referenceFieldGroups={referenceFieldGroups}
        className="theme-answer-text min-h-18 px-3 py-2.5 text-sm text-gray-700"
        stopPropagation={!readOnly}
        staticToolbar={showToolbar}
      />
    </div>
  );
}

export const richTextFieldPlugin = createFieldPlugin({
  type: "rich_text",
  meta: {
    Icon: TextAaIcon,
    iconBg: "bg-gray-100 text-gray-500",
    label: "Rich text",
    similarTypes: ["long_text", "paragraph"],
  },
  settings: {
    caption: true,
    defaultValue: true,
    halfWidth: false,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Text",
      label: "Rich text",
      order: 30,
    },
  ],
  createField: createFieldFactory("rich_text", {
    label: "Rich text",
    required: false,
  }),
  renderBuilder: ({
    availableReferenceFieldGroups,
    availableReferenceFields,
    onChange,
    resolvedDefaultValue,
    resolvedPlaceholder,
  }) => (
    <RichTextField
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
      placeholder={resolvedPlaceholder}
      referenceFields={availableReferenceFields}
      referenceFieldGroups={availableReferenceFieldGroups}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
