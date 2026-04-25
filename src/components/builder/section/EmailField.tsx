import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
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
      className={`theme-answer-input flex min-h-11 items-stretch overflow-hidden rounded-lg border bg-white transition-colors ${
        hasError
          ? "border-red-400 focus-within:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus-within:border-primary-400"
      }`}
    >
      <div className="theme-answer-addon flex w-20 shrink-0 items-center justify-center border-r px-3">
        <EnvelopeSimpleIcon size={14} className="theme-answer-placeholder" />
      </div>
      <input
        type="text"
        value={defaultValue ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder={placeholder || "Email address..."}
        className="theme-answer-placeholder theme-answer-text min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-xs"
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

