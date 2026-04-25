import { CaretDownIcon, PhoneIcon } from "@phosphor-icons/react";
import { BUILDER_PHONE_COUNTRIES, getFlagEmoji } from "@/constants";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import { FieldPluginLabel } from "./FieldSettingControls";

type Props = {
  countryCode?: string;
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function PhoneField({
  countryCode,
  defaultValue,
  hasError = false,
  onChange,
  placeholder,
}: Props) {
  return (
    <div
      className={`theme-answer-input flex items-center overflow-hidden rounded-lg border bg-white ${
        hasError ? "border-red-400" : "border-gray-200"
      }`}
    >
      <div className="flex shrink-0 items-center gap-1 border-r border-gray-100 bg-gray-50 px-3 py-2.5">
        <span className="text-base leading-none">
          {getFlagEmoji(countryCode ?? "US")}
        </span>
        <CaretDownIcon size={10} className="text-gray-400" />
      </div>
      <input
        type="tel"
        value={defaultValue ?? ""}
        placeholder={placeholder || "Phone number"}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        className="theme-answer-input flex-1 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-xs placeholder:text-gray-300"
      />
    </div>
  );
}

export const phoneFieldPlugin = createFieldPlugin({
  type: "phone",
  meta: {
    Icon: PhoneIcon,
    iconBg: "bg-blue-100 text-blue-600",
    label: "Phone",
    similarTypes: ["short_text", "email"],
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
      category: "Contact Info",
      label: "Phone number",
      order: 20,
    },
  ],
  createField: createFieldFactory("phone", {
    countryCode: "US",
    label: "Phone",
    required: false,
  }),
  renderBuilder: ({
    field,
    onChange,
    resolvedDefaultValue,
    resolvedPlaceholder,
  }) => (
    <PhoneField
      countryCode={field.countryCode}
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value || undefined })}
      placeholder={resolvedPlaceholder}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    basic: (
      <div>
        <FieldPluginLabel>Country</FieldPluginLabel>
        <select
          value={field.countryCode ?? "US"}
          onChange={(event) => onChange({ countryCode: event.target.value })}
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
        >
          {BUILDER_PHONE_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {getFlagEmoji(country.code)} {country.name} ({country.dial})
            </option>
          ))}
        </select>
      </div>
    ),
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
