import type { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  DotsNineIcon,
  InfoIcon,
  MegaphoneIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import RichInput from "../utils/RichInput";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { FormField } from "@/types/form";

const BANNER_COLORS = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    icon: "text-blue-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    icon: "text-amber-500",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-900",
    icon: "text-red-500",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    icon: "text-green-500",
  },
} as const;

const BANNER_ICONS = {
  info: <InfoIcon size={16} weight="fill" />,
  warning: <WarningIcon size={16} weight="fill" />,
  error: <WarningCircleIcon size={16} weight="fill" />,
  success: <CheckCircleIcon size={16} weight="fill" />,
} as const;

type BannerFieldCardProps = {
  availableReferenceFieldGroups: ConditionFieldGroup[];
  availableReferenceFields: FormField[];
  dragListeners: HTMLAttributes<HTMLDivElement>;
  field: FormField;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
  onSelect: HTMLAttributes<HTMLDivElement>["onClickCapture"];
};

export function BannerFieldCard({
  availableReferenceFieldGroups,
  availableReferenceFields,
  dragListeners,
  field,
  isSelected,
  onChange,
  onSelect,
}: BannerFieldCardProps) {
  const colors = BANNER_COLORS[field.bannerType ?? "info"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`cursor-pointer rounded-lg transition-all duration-150 ${
        isSelected ? "ring-2 ring-primary-400 ring-offset-1" : ""
      }`}
    >
      <div
        className={`${colors.bg} ${colors.border} flex items-start gap-3 rounded-lg border px-4 py-3`}
      >
        <div
          {...dragListeners}
          className={`${colors.icon} mt-0.5 shrink-0 cursor-grab touch-none opacity-30 transition-opacity group-hover:opacity-100 active:cursor-grabbing`}
        >
          <DotsNineIcon size={14} weight="bold" />
        </div>
        <span className={`mt-0.5 shrink-0 ${colors.icon}`}>
          {BANNER_ICONS[field.bannerType ?? "info"]}
        </span>
        <div className="min-w-0 flex-1" onClick={(event) => event.stopPropagation()}>
          <RichInput
            value={field.label}
            onChange={(value) => onChange({ label: value })}
            placeholder="Write banner content here..."
            referenceFields={availableReferenceFields}
            referenceFieldGroups={availableReferenceFieldGroups}
            className={`${colors.text} w-full bg-transparent text-sm`}
            stopPropagation
          />
        </div>
      </div>
    </motion.div>
  );
}

export const bannerFieldPlugin = createFieldPlugin({
  type: "banner_block",
  meta: {
    Icon: MegaphoneIcon,
    iconBg: "bg-amber-100 text-amber-500",
    label: "Banner",
  },
  settings: {
    displayOnly: true,
    halfWidth: true,
    logic: false,
  },
  palettes: [
    {
      placement: "builder",
      category: "Display text",
      label: "Banner",
      order: 30,
    },
    {
      placement: "ending",
      category: "Content",
      label: "Banner",
      order: 30,
    },
  ],
  createField: createFieldFactory("banner_block", {
    bannerType: "info",
    label: "Banner",
    required: false,
  }),
  renderCard: ({
    availableReferenceFieldGroups,
    availableReferenceFields,
    dragListeners,
    field,
    isSelected,
    onChange,
    onSelect,
  }) => (
    <BannerFieldCard
      availableReferenceFieldGroups={availableReferenceFieldGroups}
      availableReferenceFields={availableReferenceFields}
      dragListeners={dragListeners}
      field={field}
      isSelected={isSelected}
      onChange={onChange}
      onSelect={onSelect}
    />
  ),
  renderSettings: ({ field, onChange }) => (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-600">Alert type</div>
      <div className="flex gap-1">
        {(["info", "warning", "error", "success"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ bannerType: type })}
            className={`flex-1 rounded-md border bg-white py-1 text-[10px] font-semibold capitalize transition-colors ${
              (field.bannerType ?? "info") === type
                ? "border-primary-400 bg-primary-50 text-primary-600"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  ),
});
