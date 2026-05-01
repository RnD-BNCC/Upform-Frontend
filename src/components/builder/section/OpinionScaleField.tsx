import { ChartBarIcon } from "@phosphor-icons/react";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import {
  FieldPluginRequiredValidationField,
  FieldPluginScaleRangeFields,
} from "./FieldSettingSections";
import {
  FieldPluginLabel,
  normalizeFieldSettingValue,
} from "./FieldSettingControls";

type Props = {
  defaultValue?: string;
  max?: number;
  maxLabel?: string;
  min?: number;
  minLabel?: string;
  onChange: (value?: string) => void;
};

export default function OpinionScaleField({
  defaultValue,
  max = 10,
  maxLabel,
  min = 1,
  minLabel,
  onChange,
}: Props) {
  const numbers = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  const columns = numbers.length <= 10 ? numbers.length : 10;

  return (
    <div className="select-none space-y-1.5">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {numbers.map((number) => {
          const isSelected = defaultValue === String(number);

          return (
            <div
              key={number}
              onClick={(event) => {
                event.stopPropagation();
                onChange(isSelected ? undefined : String(number));
              }}
              className={`theme-answer-input cursor-pointer rounded border py-1.5 text-center text-xs font-medium transition-colors ${
                isSelected
                  ? "theme-primary-border theme-primary-soft theme-primary-text border-primary-400 bg-primary-50 text-primary-700"
                  : "theme-answer-border theme-answer-text border-gray-200 bg-white text-gray-400 hover:opacity-90"
              }`}
            >
              {number}
            </div>
          );
        })}
      </div>
      {(minLabel || maxLabel) && (
        <div className="theme-answer-placeholder flex justify-between text-xs text-gray-400">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

export const opinionScaleFieldPlugin = createFieldPlugin({
  type: "opinion_scale",
  meta: {
    Icon: ChartBarIcon,
    iconBg: "bg-yellow-100 text-yellow-600",
    label: "Opinion scale",
  },
  settings: {
    caption: true,
    halfWidth: false,
  },
  palettes: [
    {
      placement: "builder",
      category: "Rating & Ranking",
      label: "Opinion scale",
      order: 40,
    },
  ],
  createField: createFieldFactory("opinion_scale", {
    label: "Opinion scale",
    required: false,
  }),
  renderBuilder: ({ field, onChange }) => (
    <OpinionScaleField
      defaultValue={field.defaultValue}
      max={field.scaleMax}
      maxLabel={field.maxLabel}
      min={field.scaleMin}
      minLabel={field.minLabel}
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
      <>
        <FieldPluginScaleRangeFields field={field} onChange={onChange} />
        <div>
          <div className="mb-1 flex items-center justify-between">
            <FieldPluginLabel>Default value</FieldPluginLabel>
            {field.defaultValue ? (
              <button
                onClick={() => onChange({ defaultValue: undefined })}
                className="text-[10px] text-gray-400 transition-colors hover:text-red-400"
              >
                Clear
              </button>
            ) : null}
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
            placeholder={`${field.scaleMin ?? 1}-${field.scaleMax ?? 10}`}
          />
        </div>
      </>
    ),
    validation: (
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    ),
  }),
});
