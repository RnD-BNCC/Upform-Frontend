import type { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { ArrowsClockwiseIcon, DotsNineIcon } from "@phosphor-icons/react";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import type { FormField } from "@/types/form";
import {
  ActionButtonAlignmentSelector,
  ActionButtonColorField,
  FieldSettingLabel,
  getActionButtonAlignClass,
} from "./ActionButtonFieldShared";

type FillAgainButtonFieldCardProps = {
  dragListeners: HTMLAttributes<HTMLDivElement>;
  field: FormField;
  isSelected: boolean;
  onSelect: HTMLAttributes<HTMLDivElement>["onClickCapture"];
};

export function FillAgainButtonFieldCard({
  dragListeners,
  field,
  isSelected,
  onSelect,
}: FillAgainButtonFieldCardProps) {
  const isFull = field.buttonAlign === "full";
  const alignClass = getActionButtonAlignClass(field.buttonAlign);

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
      <div className="flex items-center gap-3 px-2 py-2">
        <div
          {...dragListeners}
          className="shrink-0 cursor-grab touch-none text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <DotsNineIcon size={14} weight="bold" />
        </div>
        <div className={`flex-1 ${isFull ? "" : `flex ${alignClass}`}`}>
          <button
            className={`theme-primary-button pointer-events-none cursor-default rounded-lg py-2 text-sm font-semibold ${
              isFull ? "w-full" : "px-5"
            }`}
            style={{
              background: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
              color:
                field.textColor || "var(--upform-theme-button-text, #ffffff)",
            }}
          >
            {field.label || "Fill out again"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export const fillAgainButtonFieldPlugin = createFieldPlugin({
  type: "fill_again_button",
  meta: {
    Icon: ArrowsClockwiseIcon,
    iconBg: "bg-rose-100 text-rose-500",
    label: "Fill Again",
  },
  settings: {
    displayOnly: true,
    halfWidth: true,
    logic: false,
  },
  palettes: [
    {
      placement: "ending",
      category: "Navigation",
      label: "Fill Again",
      order: 20,
    },
  ],
  createField: createFieldFactory("fill_again_button", {
    buttonAlign: "full",
    label: "Fill out again",
    required: false,
  }),
  renderCard: ({ dragListeners, field, isSelected, onSelect }) => (
    <FillAgainButtonFieldCard
      dragListeners={dragListeners}
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  ),
  renderSettings: ({ field, onChange }) => (
    <>
      <div>
        <FieldSettingLabel>Button text</FieldSettingLabel>
        <input
          type="text"
          value={field.label ?? ""}
          onChange={(event) => onChange({ label: event.target.value })}
          placeholder="Fill out again"
          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        />
      </div>
      <div>
        <FieldSettingLabel>Alignment</FieldSettingLabel>
        <ActionButtonAlignmentSelector
          value={field.buttonAlign}
          onChange={(value) => onChange({ buttonAlign: value })}
        />
      </div>
      <ActionButtonColorField
        label="Button color"
        value={field.buttonColor}
        defaultColor="#0054a5"
        onChange={(value) => onChange({ buttonColor: value })}
      />
      <ActionButtonColorField
        label="Text color"
        value={field.textColor}
        defaultColor="#ffffff"
        onChange={(value) => onChange({ textColor: value })}
      />
    </>
  ),
});
