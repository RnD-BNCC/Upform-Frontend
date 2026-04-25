import { EnvelopeSimpleIcon } from '@phosphor-icons/react'
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

export default function EmailField({
  placeholder,
  defaultValue,
  hasError = false,
  onChange,
}: Props) {
  return (
    <div
      className={`theme-answer-input flex items-center overflow-hidden rounded-lg border bg-transparent transition-colors ${
        hasError
          ? "border-red-400 focus-within:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus-within:border-primary-400"
      }`}
    >
      <div className="flex items-center px-3 py-2.5 bg-gray-50 border-r border-gray-100 shrink-0">
        <EnvelopeSimpleIcon size={14} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={defaultValue ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder || 'Email address…'}
        className="theme-answer-input flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-300 placeholder:text-xs"
      />
    </div>
  );
}

export const emailFieldPlugin = createFieldPlugin({
  type: "email",
  meta: {
    Icon: EnvelopeSimpleIcon,
    iconBg: "bg-blue-100 text-blue-600",
    label: "Email",
    similarTypes: ["short_text", "phone"],
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
      label: "Email input",
      order: 30,
    },
    {
      placement: "builder",
      category: "Contact Info",
      label: "Email input",
      order: 10,
    },
  ],
  createField: createFieldFactory("email", {
    label: "Email",
    required: false,
  }),
  renderBuilder: ({ onChange, resolvedDefaultValue, resolvedPlaceholder }) => (
    <EmailField
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
