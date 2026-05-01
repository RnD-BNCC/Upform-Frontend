import { HashIcon } from "@phosphor-icons/react";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";

type Props = {
  defaultValue?: string;
  hasError?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function NumberField({
  defaultValue,
  hasError = false,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const isDisabled = disabled ?? !onChange;

  return (
    <input
      type="number"
      disabled={isDisabled}
      value={defaultValue ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      placeholder={defaultValue ? "" : placeholder ?? ""}
      className={`theme-answer-input w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none ${
        isDisabled ? "cursor-default" : ""
      } ${
        hasError
          ? "border-red-400 focus:border-red-500"
          : "border-gray-200"
      } ${
        defaultValue
          ? "text-gray-600"
          : "text-gray-300 placeholder:text-xs placeholder:text-gray-300"
      }`}
    />
  );
}

export const numberFieldPlugin = createFieldPlugin({
  type: "number",
  meta: {
    Icon: HashIcon,
    iconBg: "bg-purple-100 text-purple-600",
    label: "Number",
    similarTypes: ["short_text", "currency"],
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
      category: "Number",
      label: "Number",
      order: 10,
    },
  ],
  createField: createFieldFactory("number", {
    label: "Number",
    required: false,
  }),
  renderBuilder: ({ resolvedDefaultValue, resolvedPlaceholder }) => (
    <NumberField
      disabled
      defaultValue={resolvedDefaultValue}
      placeholder={resolvedPlaceholder}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
