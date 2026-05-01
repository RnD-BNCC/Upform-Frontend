import { memo } from "react";
import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import {
  FieldPluginRequiredValidationField,
  FieldPluginScaleRangeFields,
} from "./FieldSettingSections";
import {
  FieldPluginLabel,
  FieldPluginToggleRow,
} from "./FieldSettingControls";
import { stripHtmlToText } from "@/utils/form/referenceTokens";

type Props = {
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
  defaultValue?: string;
  displayCurrentValue?: boolean;
  showValueAsPercentage?: boolean;
  onChange?: (value: string) => void;
};

export const LinearScaleField = memo(function LinearScaleField({
  scaleMax,
  minLabel,
  maxLabel,
  defaultValue,
  displayCurrentValue,
  showValueAsPercentage,
  onChange,
}: Props) {
  const start = 1;
  const end = scaleMax ?? 10;
  const current = defaultValue ? Number(defaultValue) : start;

  const pct = Math.round(((current - start) / (end - start)) * 100);
  const displayVal = showValueAsPercentage ? `${pct}%` : String(current);

  return (
    <div className="space-y-1.5 select-none">
      <input
        type="range"
        min={start}
        max={end}
        value={current}
        readOnly={!onChange}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`w-full accent-primary-500 h-1.5 ${onChange ? 'cursor-pointer' : 'pointer-events-none'}`}
      />
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{minLabel ?? start}</span>
        {displayCurrentValue && (
          <span className="font-semibold text-primary-600">{displayVal}</span>
        )}
        <span>{maxLabel ?? end}</span>
      </div>
    </div>
  );
});

function normalizeReferenceEditorValue(value: string) {
  return stripHtmlToText(value) ? value : undefined;
}

export const linearScaleFieldPlugin = createFieldPlugin({
  type: "linear_scale",
  meta: {
    Icon: SlidersHorizontalIcon,
    iconBg: "bg-yellow-100 text-yellow-600",
    label: "Linear scale",
  },
  settings: {
    caption: true,
    defaultValue: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Rating & Ranking",
      label: "Slider",
      order: 30,
    },
  ],
  createField: createFieldFactory("linear_scale", {
    label: "Linear scale",
    required: false,
  }),
  renderBuilder: ({ field, onChange }) => (
    <LinearScaleField
      scaleMax={field.scaleMax}
      minLabel={field.minLabel}
      maxLabel={field.maxLabel}
      defaultValue={field.defaultValue}
      displayCurrentValue={field.displayCurrentValue}
      showValueAsPercentage={field.showValueAsPercentage}
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
          <FieldPluginLabel>Default value</FieldPluginLabel>
          <ReferenceTextEditor
            availableFields={availableFields}
            availableFieldGroups={availableFieldGroups}
            value={field.defaultValue ?? ""}
            onChange={(nextValue) =>
              onChange({
                defaultValue: normalizeReferenceEditorValue(nextValue),
              })
            }
            placeholder={`1-${field.scaleMax ?? 10}`}
          />
        </div>
        <FieldPluginToggleRow
          label="Display current value"
          checked={field.displayCurrentValue ?? false}
          onChange={(value) =>
            onChange({ displayCurrentValue: value || undefined })
          }
        />
        <FieldPluginToggleRow
          label="Show as percentage"
          checked={field.showValueAsPercentage ?? false}
          onChange={(value) =>
            onChange({ showValueAsPercentage: value || undefined })
          }
        />
      </>
    ),
    validation: (
      <FieldPluginRequiredValidationField field={field} onChange={onChange} />
    ),
  }),
});
