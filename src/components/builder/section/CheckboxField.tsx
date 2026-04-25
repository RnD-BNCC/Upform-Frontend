import { CheckSquareIcon } from "@phosphor-icons/react";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import { SelectionCheckIcon } from "@/components/icons";
import {
  formatOptionIndexes,
  parseOptionIndexes,
} from "@/utils/form/optionSelection";
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
  onOtherTextChange?: (value: string) => void;
  onRuntimeChange?: (values: string[]) => void;
  optionImages?: Record<string, string>;
  optionImageWidths?: Record<string, number>;
  options: string[];
  otherText?: string;
  selectedValues?: string[];
  showOtherOption?: boolean;
};

export default function CheckboxField({
  defaultValue,
  maxVisibleOptions = 4,
  onChange,
  onOtherTextChange,
  onRuntimeChange,
  optionImages,
  optionImageWidths,
  options,
  otherText,
  selectedValues,
  showOtherOption = false,
}: Props) {
  const visibleOptions = options.length ? options : ["Option 1", "Option 2"];
  const optionsToRender = visibleOptions.slice(0, maxVisibleOptions);
  const isRuntimeMode = Boolean(onRuntimeChange);
  const runtimeSelections = selectedValues ?? [];
  const runtimeOtherValue = runtimeSelections.find((value) =>
    value.startsWith("__other__:"),
  );
  const resolvedOtherText =
    otherText ?? runtimeOtherValue?.slice("__other__:".length) ?? "";

  const getIsSelected = (option: string, optionIndex: number) =>
    isRuntimeMode
      ? runtimeSelections.includes(option)
      : parseOptionIndexes(defaultValue).includes(optionIndex);

  const updateRuntimeSelections = (values: string[]) => {
    onRuntimeChange?.(values);
  };

  return (
    <div className="select-none space-y-2">
      {optionsToRender.map((option, index) => {
        const optionIndex = index + 1;
        const isSelected = getIsSelected(option, optionIndex);

        return (
          <div
            key={`${option}-${index}`}
            onClick={(event) => {
              event.stopPropagation();
              if (isRuntimeMode) {
                const nextSelections = isSelected
                  ? runtimeSelections.filter((value) => value !== option)
                  : [...runtimeSelections, option];
                updateRuntimeSelections(nextSelections);
                return;
              }

              const selectedIndexes = parseOptionIndexes(defaultValue);
              const nextIndexes = isSelected
                ? selectedIndexes.filter((value) => value !== optionIndex)
                : [...selectedIndexes, optionIndex];

              onChange(formatOptionIndexes(nextIndexes));
            }}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
              isSelected
                ? "theme-primary-border theme-primary-soft border-primary-400 bg-primary-50"
                : "theme-answer-input theme-answer-border border-gray-200 bg-white hover:opacity-90"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
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
            >
              {isSelected && <SelectionCheckIcon className="text-white" />}
            </span>
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
            const hasOther = runtimeSelections.some((value) =>
              value.startsWith("__other__:"),
            );
            updateRuntimeSelections(
              hasOther
                ? runtimeSelections.filter((value) => !value.startsWith("__other__:"))
                : [...runtimeSelections, `__other__:${resolvedOtherText}`],
            );
          }}
          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
            runtimeOtherValue
              ? "theme-primary-border theme-primary-soft border-primary-400 bg-primary-50"
              : "theme-answer-input theme-answer-border border-gray-200 bg-white hover:opacity-90"
          }`}
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
              runtimeOtherValue
                ? "theme-primary-border bg-primary-500"
                : "theme-answer-border border-gray-300"
            }`}
            style={
              runtimeOtherValue
                ? {
                    background: "var(--upform-theme-primary, #0054a5)",
                    borderColor: "var(--upform-theme-primary, #0054a5)",
                  }
                : undefined
            }
          >
            {runtimeOtherValue ? <SelectionCheckIcon className="text-white" /> : null}
          </span>
          <div className="min-w-0 flex-1">
            <span
              className={`block text-sm ${
                runtimeOtherValue
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
                updateRuntimeSelections([
                  ...runtimeSelections.filter((value) => !value.startsWith("__other__:")),
                  `__other__:${nextValue}`,
                ]);
              }}
              onFocus={() => {
                if (runtimeOtherValue) return;
                updateRuntimeSelections([
                  ...runtimeSelections.filter((value) => !value.startsWith("__other__:")),
                  `__other__:${resolvedOtherText}`,
                ]);
              }}
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

export const checkboxFieldPlugin = createFieldPlugin({
  type: "checkbox",
  meta: {
    Icon: CheckSquareIcon,
    iconBg: "bg-orange-100 text-orange-600",
    label: "Checkbox",
    similarTypes: ["multiple_choice", "multiselect", "dropdown"],
  },
  settings: {
    caption: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Choices",
      label: "Checkboxes",
      order: 20,
    },
  ],
  createField: createFieldFactory("checkbox", {
    label: "Checkbox",
    options: ["Option 1", "Option 2"],
    required: false,
  }),
  renderBuilder: ({ field, onChange }) => (
    <CheckboxField
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
            placeholder="e.g. 1, 3"
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
