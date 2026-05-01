import { HeartIcon, StarIcon, ThumbsUpIcon } from "@phosphor-icons/react";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import { RatingSection } from "./RatingSection";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import {
  FieldPluginLabel,
  FieldPluginToggleRow,
  normalizeFieldSettingValue,
} from "./FieldSettingControls";

type Props = {
  allowHalfStar?: boolean;
  defaultValue?: string;
  maxLabel?: string;
  minLabel?: string;
  onChange: (value: string) => void;
  ratingIcon?: "star" | "heart" | "thumb";
  scaleMax?: number;
};

export default function RatingField({
  allowHalfStar,
  defaultValue,
  maxLabel,
  minLabel,
  onChange,
  ratingIcon,
  scaleMax,
}: Props) {
  return (
    <RatingSection
      scaleMax={scaleMax}
      ratingIcon={ratingIcon}
      minLabel={minLabel}
      maxLabel={maxLabel}
      defaultValue={defaultValue}
      allowHalfStar={allowHalfStar}
      onChange={onChange}
    />
  );
}

export const ratingFieldPlugin = createFieldPlugin({
  type: "rating",
  meta: {
    Icon: StarIcon,
    iconBg: "bg-yellow-100 text-yellow-600",
    label: "Rating",
  },
  settings: {
    caption: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "Rating & Ranking",
      label: "Star Rating",
      order: 20,
    },
  ],
  createField: createFieldFactory("rating", {
    label: "Rating",
    required: false,
  }),
  renderBuilder: ({ field, onChange, resolvedDefaultValue }) => (
    <RatingField
      scaleMax={field.scaleMax}
      ratingIcon={field.ratingIcon}
      minLabel={field.minLabel}
      maxLabel={field.maxLabel}
      defaultValue={resolvedDefaultValue}
      allowHalfStar={field.allowHalfStar}
      onChange={(value) => onChange({ defaultValue: value })}
    />
  ),
  renderSettings: ({ availableFieldGroups, availableFields, field, onChange }) => (
    <>
      <div>
        <FieldPluginLabel>Icon</FieldPluginLabel>
        <div className="flex gap-1">
          {(
            [
              {
                value: "star",
                label: "Star",
                Icon: StarIcon,
                iconClassName: "text-yellow-400",
              },
              {
                value: "heart",
                label: "Heart",
                Icon: HeartIcon,
                iconClassName: "text-red-400",
              },
              {
                value: "thumb",
                label: "Thumb",
                Icon: ThumbsUpIcon,
                iconClassName: "text-primary-500",
              },
            ] as const
          ).map(({ value, label, Icon, iconClassName }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ratingIcon: value })}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border bg-white py-1 text-[10px] font-semibold transition-colors ${
                (field.ratingIcon ?? "star") === value
                  ? "border-primary-400 bg-primary-50 text-primary-600"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Icon size={11} weight="fill" className={iconClassName} />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldPluginLabel>Scale</FieldPluginLabel>
          <select
            value={field.scaleMax ?? 5}
            onChange={(event) =>
              onChange({ scaleMax: Number(event.target.value) })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <option key={value} value={value}>
                {value} stars
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldPluginLabel>Default</FieldPluginLabel>
          <ReferenceTextEditor
            availableFields={availableFields}
            availableFieldGroups={availableFieldGroups}
            value={field.defaultValue ?? ""}
            onChange={(nextValue) =>
              onChange({
                defaultValue: normalizeFieldSettingValue(nextValue),
              })
            }
            placeholder="None"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldPluginLabel>Min label</FieldPluginLabel>
          <input
            type="text"
            value={field.minLabel ?? ""}
            onChange={(event) =>
              onChange({ minLabel: event.target.value || undefined })
            }
            placeholder="e.g. Bad"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
        <div>
          <FieldPluginLabel>Max label</FieldPluginLabel>
          <input
            type="text"
            value={field.maxLabel ?? ""}
            onChange={(event) =>
              onChange({ maxLabel: event.target.value || undefined })
            }
            placeholder="e.g. Great"
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
      </div>
      <FieldPluginToggleRow
        label="Allow half star"
        checked={field.allowHalfStar ?? false}
        onChange={(value) => onChange({ allowHalfStar: value || undefined })}
      />
    </>
  ),
});
