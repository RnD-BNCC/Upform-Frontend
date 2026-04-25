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
  options: string[];
  placeholder?: string;
  showClearButton?: boolean;
};

export default function DropdownField({
  defaultValue,
  hasError = false,
  onChange,
  options,
  placeholder,
  showClearButton = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        className={`theme-answer-input flex cursor-pointer items-center rounded-lg border bg-white px-3 py-2.5 transition-colors ${
          hasError
            ? "border-red-400"
            : open
              ? "border-primary-500"
              : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span
          className={`flex-1 ${
            defaultValue ? "text-sm text-gray-700" : "text-xs text-gray-300"
          } ${defaultValue ? "" : "theme-answer-placeholder"}`}
        >
          {defaultValue || placeholder || "Select an option"}
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
      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-sm">
          {options.map((option, index) => {
            const isSelected = defaultValue === option;

            return (
              <div
                key={`${option}-${index}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(isSelected ? undefined : option);
                  setOpen(false);
                }}
                className={`mx-1 my-0.5 cursor-pointer rounded-md px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? "theme-primary-soft bg-primary-50 font-medium text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option}
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
          <select
            value={field.defaultValue ?? ""}
            onChange={(event) =>
              onChange({ defaultValue: event.target.value || undefined })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
          >
            <option value="">None</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
