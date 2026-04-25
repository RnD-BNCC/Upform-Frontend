import { RadioButtonIcon } from "@phosphor-icons/react";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import {
  FieldPluginOptionsEditor,
  FieldPluginSelectionValidationFields,
} from "./FieldSettingSections";
import {
  FieldPluginToggleRow,
  normalizeFieldSettingValue,
} from "./FieldSettingControls";

type Props = {
  defaultValue?: string;
  maxVisibleOptions?: number;
  onChange: (value?: string) => void;
  optionImages?: Record<string, string>;
  optionImageWidths?: Record<string, number>;
  options: string[];
  otherText?: string;
  selectionMode?: "index" | "label";
  showOtherOption?: boolean;
  onOtherTextChange?: (value: string) => void;
};

export default function MultipleChoiceField({
  defaultValue,
  maxVisibleOptions = 4,
  onChange,
  optionImages,
  optionImageWidths,
  options,
  otherText,
  selectionMode = "index",
  showOtherOption = false,
  onOtherTextChange,
}: Props) {
  const visibleOptions = options.length ? options : ["Option 1", "Option 2"];
  const optionsToRender = visibleOptions.slice(0, maxVisibleOptions);
  const isRuntimeMode = selectionMode === "label";
  const isOtherSelected = isRuntimeMode && (defaultValue ?? "").startsWith("__other__:");
  const resolvedOtherText =
    otherText ?? (isOtherSelected ? (defaultValue ?? "").slice("__other__:".length) : "");

  const getIsSelected = (option: string, index: number) =>
    selectionMode === "label"
      ? defaultValue === option
      : index === parseInt(defaultValue ?? "", 10) - 1;

  return (
    <div className="select-none space-y-2">
      {optionsToRender.map((option, index) => {
        const isSelected = getIsSelected(option, index);

        return (
          <div
            key={`${option}-${index}`}
            onClick={(event) => {
              event.stopPropagation();
              onChange(
                isSelected
                  ? undefined
                  : selectionMode === "label"
                    ? option
                    : String(index + 1),
              );
            }}
            className={`theme-answer-input flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
              isSelected
                ? "theme-primary-border theme-primary-soft border-primary-400 bg-primary-50"
                : "theme-answer-border border-gray-200 bg-white hover:opacity-90"
            }`}
          >
            <span
              className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                isSelected
                  ? "theme-primary-border bg-primary-500"
                  : "theme-answer-border border-gray-300"
              }`}
              style={
                isSelected
                  ? {
                      background: "var(--upform-theme-primary, #0054a5)",
                      borderColor: "var(--upform-theme-primary, #0054a5)",
                    }
                  : undefined
              }
            />
            <div className="min-w-0 flex-1">
              <span
                className={`block text-sm ${
                  isSelected
                    ? "theme-primary-text font-medium text-primary-700"
                    : "theme-answer-text text-gray-500"
                }`}
              >
                {option}
              </span>
              {optionImages?.[option] ? (
                <div
                  className="mt-1.5 block"
                  style={
                    optionImageWidths?.[option]
                      ? { width: `${optionImageWidths[option]}%` }
                      : undefined
                  }
                >
                  <img
                    src={optionImages[option]}
                    className={`rounded-md border border-gray-100 object-contain ${
                      optionImageWidths?.[option] ? "w-full" : "max-h-36 max-w-xs"
                    }`}
                    alt={option}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      {isRuntimeMode && showOtherOption ? (
        <div
          onClick={(event) => {
            event.stopPropagation();
            onChange(isOtherSelected ? undefined : `__other__:${resolvedOtherText}`);
          }}
          className={`theme-answer-input flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
            isOtherSelected
              ? "theme-primary-border theme-primary-soft border-primary-400 bg-primary-50"
              : "theme-answer-border border-gray-200 bg-white hover:opacity-90"
          }`}
        >
          <span
            className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
              isOtherSelected
                ? "theme-primary-border bg-primary-500"
                : "theme-answer-border border-gray-300"
            }`}
            style={
              isOtherSelected
                ? {
                    background: "var(--upform-theme-primary, #0054a5)",
                    borderColor: "var(--upform-theme-primary, #0054a5)",
                  }
                : undefined
            }
          />
          <div className="min-w-0 flex-1">
            <span
              className={`block text-sm ${
                isOtherSelected
                  ? "theme-primary-text font-medium text-primary-700"
                  : "theme-answer-text text-gray-500"
              }`}
            >
              Other
            </span>
            <input
              type="text"
              value={resolvedOtherText}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                const nextValue = event.target.value;
                onOtherTextChange?.(nextValue);
                onChange(`__other__:${nextValue}`);
              }}
              onFocus={() => onChange(`__other__:${resolvedOtherText}`)}
              placeholder="Your answer"
              className="theme-answer-border theme-answer-placeholder theme-answer-text mt-1 w-full border-b border-transparent bg-transparent pb-0.5 text-sm outline-none transition-colors hover:opacity-90 focus:border-primary-500"
            />
          </div>
        </div>
      ) : null}
      {visibleOptions.length > optionsToRender.length && (
        <p className="pl-4 text-xs text-gray-400">
          +{visibleOptions.length - optionsToRender.length} more
        </p>
      )}
    </div>
  );
}

export const multipleChoiceFieldPlugin = createFieldPlugin({
  type: "multiple_choice",
  meta: {
    Icon: RadioButtonIcon,
    iconBg: "bg-orange-100 text-orange-600",
    label: "Multiple choice",
    similarTypes: ["checkbox", "multiselect", "dropdown", "ranking"],
  },
  settings: {
    caption: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Frequently used",
      label: "Multiple choice",
      order: 20,
    },
    {
      placement: "builder",
      category: "Choices",
      label: "Multiple choice",
      order: 30,
    },
  ],
  createField: createFieldFactory("multiple_choice", {
    label: "Multiple choice",
    options: ["Option 1", "Option 2"],
    required: false,
  }),
  renderBuilder: ({ field, onChange }) => (
    <MultipleChoiceField
      defaultValue={field.defaultValue}
      onChange={(value) => onChange({ defaultValue: value })}
      options={field.options?.length ? field.options : ["Option 1", "Option 2"]}
    />
  ),
  renderSettingsSections: ({
    availableFieldGroups,
    availableFields,
    field,
    onChange,
  }) => ({
    basic: (
      <>
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
            placeholder="e.g. 1"
          />
        </div>
        <FieldPluginToggleRow
          label='"Other" option'
          checked={field.hasOtherOption ?? false}
          onChange={(value) =>
            onChange({ hasOtherOption: value || undefined })
          }
        />
      </>
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
