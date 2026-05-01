import { TextTIcon } from "@phosphor-icons/react";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
};

export default function ShortTextField({
  placeholder,
  defaultValue,
  hasError = false,
  onChange,
}: Props) {
  return (
    <input
      type="text"
      value={defaultValue ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      placeholder={placeholder || 'Short answer…'}
      className={`theme-answer-input w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent outline-none transition-colors ${
        hasError
          ? "border-red-400 text-gray-700 focus:border-red-500"
          : "border-gray-200 text-gray-700 hover:border-gray-300 focus:border-primary-400"
      } placeholder:text-gray-300 placeholder:text-xs`}
    />
  );
}

export const shortTextFieldPlugin = createFieldPlugin({
  type: "short_text",
  meta: {
    Icon: TextTIcon,
    iconBg: "bg-green-100 text-green-600",
    label: "Short text",
    similarTypes: ["long_text", "email", "number", "phone"],
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
      category: "Frequently used",
      label: "Short answer",
      order: 10,
    },
    {
      placement: "builder",
      category: "Text",
      label: "Short answer",
      order: 10,
    },
  ],
  createField: createFieldFactory("short_text", {
    label: "Short text",
    required: false,
  }),
  renderBuilder: ({ onChange, resolvedDefaultValue, resolvedPlaceholder }) => (
    <ShortTextField
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
