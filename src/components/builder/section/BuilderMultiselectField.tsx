import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, ListChecksIcon, XIcon } from "@phosphor-icons/react";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import {
  formatOptionIndexes,
  getIndexedOptionValues,
  parseOptionIndexes,
} from "@/utils/form/optionSelection";
import {
  FieldPluginOptionsEditor,
  FieldPluginSelectionValidationFields,
} from "./FieldSettingSections";
import { normalizeFieldSettingValue } from "./FieldSettingControls";

type Props = {
  hasError?: boolean;
  onRuntimeChange?: (values: string[]) => void;
  options: string[];
  placeholder?: string;
  defaultValue?: string;
  onChange: (value?: string) => void;
  selectedValues?: string[];
};

export function BuilderMultiselectField({
  hasError = false,
  onRuntimeChange,
  options,
  placeholder,
  defaultValue,
  onChange,
  selectedValues,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRuntimeMode = Boolean(onRuntimeChange);
  const selectedIndexes = parseOptionIndexes(defaultValue).filter(
    (index) => index <= options.length,
  );
  const runtimeDefaults = getIndexedOptionValues(options, defaultValue);
  const runtimeSelectedValues = selectedValues ?? runtimeDefaults;
  const runtimeDefaultKey = runtimeDefaults.join("\u0000");
  const selectedItems = isRuntimeMode
    ? runtimeSelectedValues.map((label) => ({
        label,
      }))
    : selectedIndexes
        .map((index) => ({
          index,
          label: options[index - 1],
        }))
        .filter(
          (
            item,
          ): item is {
            index: number;
            label: string;
          } => Boolean(item.label),
        );
  const availableItems = isRuntimeMode
    ? options
        .filter((label) => !runtimeSelectedValues.includes(label))
        .map((label) => ({ label }))
    : options
        .map((label, index) => ({ index: index + 1, label }))
        .filter((item) => !selectedIndexes.includes(item.index));

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!isRuntimeMode || selectedValues !== undefined || runtimeDefaults.length === 0) {
      return;
    }

    onRuntimeChange?.(runtimeDefaults);
  }, [
    isRuntimeMode,
    onRuntimeChange,
    runtimeDefaultKey,
    runtimeDefaults,
    selectedValues,
  ]);

  const updateSelections = (indexes: number[]) => {
    onChange(formatOptionIndexes(indexes));
  };
  const updateRuntimeSelections = (values: string[]) => {
    onRuntimeChange?.(values);
  };

  const containerClassName = `relative w-full select-none`;
  const triggerClassName = `theme-answer-input flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition-colors ${
    hasError
      ? "border-red-400"
      : open
        ? "border-primary-500"
        : "border-gray-200 hover:border-gray-300"
  }`;

  return (
    <div ref={containerRef} className={containerClassName}>
      <div
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={triggerClassName}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (isRuntimeMode) {
                    updateRuntimeSelections(
                      runtimeSelectedValues.filter((value) => value !== item.label),
                    );
                    return;
                  }

                  const builderItem = item as { index: number; label: string };
                  updateSelections(
                    selectedIndexes.filter((index) => index !== builderItem.index),
                  );
                }}
                className="theme-primary-button inline-flex max-w-full items-center gap-1 rounded bg-primary-500 px-2 py-1 text-xs font-medium text-white"
              >
                <span className="max-w-32 truncate">{item.label}</span>
                <XIcon size={11} weight="bold" className="shrink-0" />
              </button>
            ))
          ) : (
            <span className="theme-answer-placeholder text-xs text-gray-300">
              {placeholder || "Select options"}
            </span>
          )}
        </div>
        {selectedItems.length > 0 && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (isRuntimeMode) {
                  updateRuntimeSelections([]);
                  return;
                }

                updateSelections([]);
              }}
              className="shrink-0 text-gray-300 transition-colors hover:text-gray-500"
            >
              <XIcon size={13} />
            </button>
            <span className="h-4 w-px shrink-0 bg-gray-200" />
          </>
        )}
        <CaretDownIcon
          size={14}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-sm">
          {availableItems.length > 0 ? (
            availableItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (isRuntimeMode) {
                    updateRuntimeSelections([...runtimeSelectedValues, item.label]);
                    return;
                  }

                  const builderItem = item as { index: number; label: string };
                  updateSelections([...selectedIndexes, builderItem.index]);
                }}
                className="mx-1 my-0.5 w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                {item.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-gray-400">No more options</p>
          )}
        </div>
      )}
    </div>
  );
}

export const multiselectFieldPlugin = createFieldPlugin({
  type: "multiselect",
  meta: {
    Icon: ListChecksIcon,
    iconBg: "bg-orange-100 text-orange-600",
    label: "Multiselect",
    similarTypes: ["checkbox", "multiple_choice", "dropdown"],
  },
  settings: {
    caption: true,
    halfWidth: true,
    placeholder: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Choices",
      label: "Multiselect",
      order: 40,
    },
  ],
  createField: createFieldFactory("multiselect", {
    label: "Multiselect",
    options: ["Option 1", "Option 2"],
    required: false,
  }),
  renderBuilder: ({ field, onChange, resolvedDefaultValue, resolvedPlaceholder }) => (
    <BuilderMultiselectField
      options={field.options?.length ? field.options : ["Option 1", "Option 2"]}
      placeholder={resolvedPlaceholder}
      defaultValue={resolvedDefaultValue}
      onChange={(value) => onChange({ defaultValue: value })}
    />
  ),
  renderSettingsSections: ({
    availableFieldGroups,
    availableFields,
    field,
    onChange,
  }) => ({
    basic: (
      <div>
        <div className="mb-1 flex items-center gap-1">
          <span className="text-xs font-medium text-gray-600">
            Default value
          </span>
        </div>
        <ReferenceTextEditor
          availableFields={availableFields}
          availableFieldGroups={availableFieldGroups}
          value={field.defaultValue ?? ""}
          onChange={(nextValue) =>
            onChange({
              defaultValue: normalizeFieldSettingValue(nextValue),
            })
          }
          placeholder="e.g. 1, 3"
        />
      </div>
    ),
    options: (
      <FieldPluginOptionsEditor
        options={field.options ?? []}
        onChange={(options) => onChange({ options })}
      />
    ),
    validation: (
      <FieldPluginSelectionValidationFields field={field} onChange={onChange} />
    ),
  }),
});
