import { MapPinIcon } from "@phosphor-icons/react";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import { FieldPluginTextValidationFields } from "./FieldSettingSections";
import { FieldPluginLabel } from "./FieldSettingControls";

type Props = {
  cityPlaceholder?: string;
  cityValue?: string;
  hasError?: boolean;
  onChange?: (value: {
    city?: string;
    state?: string;
    street?: string;
    zip?: string;
  }) => void;
  statePlaceholder?: string;
  stateValue?: string;
  streetPlaceholder?: string;
  streetValue?: string;
  zipPlaceholder?: string;
  zipValue?: string;
};

export default function AddressField({
  cityPlaceholder,
  cityValue,
  hasError = false,
  onChange,
  statePlaceholder,
  stateValue,
  streetPlaceholder,
  streetValue,
  zipPlaceholder,
  zipValue,
}: Props) {
  const isRuntimeMode = Boolean(onChange);
  const updateValue = (
    key: "city" | "state" | "street" | "zip",
    value: string,
  ) => {
    onChange?.({
      city: cityValue,
      state: stateValue,
      street: streetValue,
      zip: zipValue,
      [key]: value || undefined,
    });
  };

  return (
    <div className={`${isRuntimeMode ? "" : "pointer-events-none"} space-y-2 select-none`}>
      <div>
        <span className="theme-question-caption mb-1 block text-xs text-gray-400">Address</span>
        <div
          className={`theme-answer-input flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 ${
            hasError ? "border-red-400" : "border-gray-200"
          }`}
        >
          <MapPinIcon size={14} className="shrink-0 text-gray-300" />
          {isRuntimeMode ? (
            <input
              type="text"
              value={streetValue ?? ""}
              onChange={(event) => updateValue("street", event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder={streetPlaceholder ?? "Street address"}
              className="theme-answer-input w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300"
            />
          ) : (
            <span
              className={`text-xs ${streetValue ? "text-gray-600" : "theme-answer-placeholder text-gray-300"}`}
            >
              {streetValue ?? streetPlaceholder ?? "Street address"}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="theme-question-caption mb-1 block text-xs text-gray-600">City</span>
          <div
            className={`theme-answer-input rounded-lg border bg-white px-3 py-2 ${
              hasError ? "border-red-400" : "border-gray-200"
            }`}
          >
            {isRuntimeMode ? (
              <input
                type="text"
                value={cityValue ?? ""}
                onChange={(event) => updateValue("city", event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={cityPlaceholder ?? "City"}
                className="theme-answer-input w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300"
              />
            ) : (
              <span
                className={`text-xs ${cityValue ? "text-gray-600" : "theme-answer-placeholder text-gray-300"}`}
              >
                {cityValue ?? cityPlaceholder ?? "City"}
              </span>
            )}
          </div>
        </div>
        <div>
          <span className="theme-question-caption mb-1 block text-xs text-gray-600">
            State / Province
          </span>
          <div
            className={`theme-answer-input rounded-lg border bg-white px-3 py-2 ${
              hasError ? "border-red-400" : "border-gray-200"
            }`}
          >
            {isRuntimeMode ? (
              <input
                type="text"
                value={stateValue ?? ""}
                onChange={(event) => updateValue("state", event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={statePlaceholder ?? "State"}
                className="theme-answer-input w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300"
              />
            ) : (
              <span
                className={`text-xs ${stateValue ? "text-gray-600" : "theme-answer-placeholder text-gray-300"}`}
              >
                {stateValue ?? statePlaceholder ?? "State"}
              </span>
            )}
          </div>
        </div>
        <div>
          <span className="theme-question-caption mb-1 block text-xs text-gray-600">
            ZIP / Postal code
          </span>
          <div
            className={`theme-answer-input rounded-lg border bg-white px-3 py-2 ${
              hasError ? "border-red-400" : "border-gray-200"
            }`}
          >
            {isRuntimeMode ? (
              <input
                type="text"
                value={zipValue ?? ""}
                onChange={(event) => updateValue("zip", event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder={zipPlaceholder ?? "ZIP"}
                className="theme-answer-input w-full bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300"
              />
            ) : (
              <span
                className={`text-xs ${zipValue ? "text-gray-600" : "theme-answer-placeholder text-gray-300"}`}
              >
                {zipValue ?? zipPlaceholder ?? "ZIP"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const addressFieldPlugin = createFieldPlugin({
  type: "address",
  meta: {
    Icon: MapPinIcon,
    iconBg: "bg-blue-100 text-blue-600",
    label: "Address",
  },
  settings: {
    caption: true,
    halfWidth: false,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Contact Info",
      label: "Address",
      order: 30,
    },
  ],
  createField: createFieldFactory("address", {
    label: "Address",
    required: false,
  }),
  renderBuilder: ({ field }) => (
    <AddressField
      cityPlaceholder={field.addressSubPlaceholders?.city}
      cityValue={field.addressSubDefaults?.city}
      statePlaceholder={field.addressSubPlaceholders?.state}
      stateValue={field.addressSubDefaults?.state}
      streetPlaceholder={field.addressSubPlaceholders?.street}
      streetValue={field.addressSubDefaults?.street}
      zipPlaceholder={field.addressSubPlaceholders?.zip}
      zipValue={field.addressSubDefaults?.zip}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    basic: (
      <>
        <div className="space-y-1.5">
          <FieldPluginLabel>Sub-field placeholders</FieldPluginLabel>
          {(
            [
              { key: "street", label: "Address line" },
              { key: "city", label: "City" },
              { key: "state", label: "State / Province" },
              { key: "zip", label: "ZIP / Postal code" },
            ] as const
          ).map(({ key, label }) => (
            <input
              key={key}
              type="text"
              placeholder={label}
              value={field.addressSubPlaceholders?.[key] ?? ""}
              onChange={(event) =>
                onChange({
                  addressSubPlaceholders: {
                    ...field.addressSubPlaceholders,
                    [key]: event.target.value || undefined,
                  },
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
            />
          ))}
        </div>
        <div className="space-y-1.5">
          <FieldPluginLabel>Default values</FieldPluginLabel>
          {(
            [
              { key: "street", label: "Address line" },
              { key: "city", label: "City" },
              { key: "state", label: "State / Province" },
              { key: "zip", label: "ZIP / Postal code" },
            ] as const
          ).map(({ key, label }) => (
            <input
              key={key}
              type="text"
              placeholder={label}
              value={field.addressSubDefaults?.[key] ?? ""}
              onChange={(event) =>
                onChange({
                  addressSubDefaults: {
                    ...field.addressSubDefaults,
                    [key]: event.target.value || undefined,
                  },
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
            />
          ))}
        </div>
      </>
    ),
    validation: (
      <FieldPluginTextValidationFields field={field} onChange={onChange} />
    ),
  }),
});
