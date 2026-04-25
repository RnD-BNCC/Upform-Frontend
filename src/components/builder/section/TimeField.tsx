import { ClockIcon } from "@phosphor-icons/react";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginRequiredValidationField } from "./FieldSettingSections";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
}

export default function TimeField({
  defaultValue,
  hasError = false,
  onChange,
}: Props) {
  return (
    <input
      type="time"
      value={defaultValue ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={`theme-answer-input w-36 rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors ${
        hasError
          ? "border-red-400 focus:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus:border-primary-400"
      }`}
    />
  )
}

export const timeFieldPlugin = createFieldPlugin({
  type: "time",
  meta: {
    Icon: ClockIcon,
    iconBg: "bg-purple-100 text-purple-600",
    label: "Time",
    similarTypes: ["date"],
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
      category: "Time",
      label: "Time picker",
      order: 20,
    },
  ],
  createField: createFieldFactory("time", {
    label: "Time",
    required: false,
  }),
  renderBuilder: ({ onChange, resolvedDefaultValue }) => (
    <TimeField
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    validation: (
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    ),
  }),
});
