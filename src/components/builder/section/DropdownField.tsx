import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import {
  FieldPluginOptionsEditor,
  FieldPluginRequiredValidationField,
} from "./FieldSettingSections";

type Props = {
  defaultValue?: string;
  hasError?: boolean;
  onChange: (value?: string) => void;
  options: Array<string | { label: string; value: string }>;
  placeholder?: string;
  showClearButton?: boolean;
  size?: "default" | "compact";
};

export default function DropdownField({
  defaultValue,
  hasError = false,
  onChange,
  options,
  placeholder,
  showClearButton = false,
  size = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
  const selectedOption = normalizedOptions.find(
    (option) => option.value === defaultValue,
  );

  const triggerPaddingClassName =
    size === "compact" ? "px-2.5 py-1.5" : "px-3 py-2.5";
  const triggerTextClassName = size === "compact" ? "text-xs" : "text-sm";
  const optionTextClassName = size === "compact" ? "text-xs" : "text-sm";

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <div
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`theme-answer-input flex cursor-pointer items-center rounded-lg border bg-white ${triggerPaddingClassName} transition-colors ${
          hasError
            ? "border-red-400"
            : open
              ? "border-primary-500"
              : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span
          className={`flex-1 ${
            selectedOption
              ? `${triggerTextClassName} text-gray-700`
              : "text-xs text-gray-300"
          } ${defaultValue ? "" : "theme-answer-placeholder"}`}
        >
          {selectedOption?.label || placeholder || "Select an option"}
        </span>
        {showClearButton && defaultValue ? (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(undefined);
              }}
              className="shrink-0 text-gray-300 transition-colors hover:text-gray-500"
            >
              <XIcon size={13} />
            </button>
            <span className="mx-2 h-4 w-px shrink-0 bg-gray-200" />
          </>
        ) : null}
        <CaretDownIcon size={14} className="shrink-0 text-gray-400" />
      </div>
      {open && normalizedOptions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-sm">
          {normalizedOptions.map((option, index) => {
            const isSelected = defaultValue === option.value;

            return (
              <div
                key={`${option.value}-${index}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(isSelected ? undefined : option.value);
                  setOpen(false);
                }}
                className={`mx-1 my-0.5 cursor-pointer rounded-md px-3 py-2 ${optionTextClassName} transition-colors ${
                  isSelected
                    ? "theme-primary-soft bg-primary-50 font-medium text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const dropdownFieldPlugin = createFieldPlugin({
  type: "dropdown",
  meta: {
    Icon: CaretDownIcon,
    iconBg: "bg-orange-100 text-orange-600",
    label: "Dropdown",
    similarTypes: ["multiple_choice", "checkbox", "multiselect"],
  },
  settings: {
    caption: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Choices",
      label: "Dropdown",
      order: 10,
    },
  ],
  createField: createFieldFactory("dropdown", {
    label: "Dropdown",
    options: ["Option 1", "Option 2"],
    required: false,
  }),
  renderBuilder: ({ field, onChange, resolvedDefaultValue, resolvedPlaceholder }) => (
    <DropdownField
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value })}
      options={field.options?.length ? field.options : ["Option 1", "Option 2"]}
      placeholder={resolvedPlaceholder}
      showClearButton
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    basic:
      (field.options?.length ?? 0) > 0 ? (
        <div>
          <div className="mb-1 flex items-center gap-1">
            <span className="text-xs font-medium text-gray-600">
              Default value
            </span>
          </div>
          <DropdownField
            defaultValue={field.defaultValue}
            onChange={(value) => onChange({ defaultValue: value })}
            options={field.options ?? []}
            placeholder="None"
            showClearButton
            size="compact"
          />
        </div>
      ) : null,
    options: (
      <FieldPluginOptionsEditor
        options={field.options ?? []}
        onChange={(options) => onChange({ options })}
      />
    ),
    validation: (
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    ),
  }),
});
