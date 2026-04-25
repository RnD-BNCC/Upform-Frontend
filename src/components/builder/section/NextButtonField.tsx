import { motion } from "framer-motion";
import { ArrowsClockwiseIcon, DotsNineIcon } from "@phosphor-icons/react";
import { createFieldFactory, createFieldPlugin } from "./fieldDefinitionHelpers";
import { FieldPluginToggleRow } from "./FieldSettingControls";
import type { FormField } from "@/types/form";
import {
  ActionButtonAlignmentSelector,
  ActionButtonColorField,
  FieldSettingLabel,
} from "./ActionButtonFieldShared";

type NextButtonFieldCardProps = {
  dragListeners: React.HTMLAttributes<HTMLDivElement>;
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  sectionType?: "page" | "ending" | "cover";
};

export function NextButtonFieldCard({
  dragListeners,
  field,
  isSelected,
  onSelect,
  sectionType,
}: NextButtonFieldCardProps) {
  const isFull = field.buttonAlign === "full";
  const alignClass = isFull
    ? ""
    : field.buttonAlign === "center"
      ? "justify-center"
      : field.buttonAlign === "right"
        ? "justify-end"
        : "justify-start";
  const isLast = sectionType === "page";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`cursor-pointer transition-all duration-150 ${
        isSelected ? "rounded-lg ring-2 ring-primary-400 ring-offset-1" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-2 py-2">
        <div
          {...dragListeners}
          className="shrink-0 cursor-grab touch-none text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <DotsNineIcon size={14} weight="bold" />
        </div>
        <div className={`flex flex-1 items-center gap-3 ${isFull ? "" : alignClass}`}>
          <button
            className={`theme-primary-button pointer-events-none cursor-default rounded-lg py-2.5 text-sm font-semibold ${
              isFull ? "w-full" : "px-6"
            }`}
            style={{
              background: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
              color:
                field.textColor || "var(--upform-theme-button-text, #ffffff)",
            }}
          >
            {field.label || (isLast ? "Next" : "Submit")}
          </button>
          {field.showSkip && (
            <span
              className="theme-primary-text select-none text-sm"
              style={{
                color: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
              }}
            >
              Skip
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const nextButtonFieldPlugin = createFieldPlugin({
  type: "next_button",
  meta: {
    Icon: ArrowsClockwiseIcon,
    iconBg: "bg-rose-100 text-rose-500",
    label: "Next Button",
  },
  settings: {
    displayOnly: true,
    halfWidth: false,
    logic: false,
  },
  createField: createFieldFactory("next_button", {
    buttonAlign: "left",
    label: "",
    required: false,
  }),
  renderCard: ({ dragListeners, field, isSelected, onSelect, sectionType }) => (
    <NextButtonFieldCard
      dragListeners={dragListeners}
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      sectionType={sectionType}
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
          placeholder="Next / Submit"
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
      <FieldPluginToggleRow
        label="Show skip button"
        checked={field.showSkip ?? false}
        onChange={(value) => onChange({ showSkip: value || undefined })}
      />
    </>
  ),
});
