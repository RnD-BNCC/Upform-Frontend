import type { HTMLAttributes, ReactNode } from "react";
import { DividerLineIcon } from "@/components/icons";
import {
  createFieldFactory,
  createFieldPlugin,
  wrapSvgIcon,
} from "./fieldDefinitionHelpers";
import type { FormField } from "@/types/form";

const DividerIcon = wrapSvgIcon(DividerLineIcon);

type DividerFieldCardProps = {
  dragHandle: ReactNode;
  field: FormField;
  isSelected: boolean;
  onSelect: HTMLAttributes<HTMLDivElement>["onClickCapture"];
};

export function DividerFieldCard({
  dragHandle,
  field,
  isSelected,
  onSelect,
}: DividerFieldCardProps) {
  return (
    <div
      onClickCapture={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-3 transition-all ${
        isSelected ? "ring-2 ring-primary-400" : "hover:ring-2 hover:ring-primary-200"
      }`}
    >
      {dragHandle}
      <div className="flex flex-1 items-center gap-2">
        <hr className="flex-1 border-gray-300" />
        {field.label && (
          <span className="shrink-0 select-none px-1 text-xs text-gray-400">
            {field.label}
          </span>
        )}
        {field.label && <hr className="flex-1 border-gray-300" />}
      </div>
    </div>
  );
}

export const dividerFieldPlugin = createFieldPlugin({
  type: "divider",
  meta: {
    Icon: DividerIcon,
    iconBg: "bg-rose-100 text-rose-500",
    label: "Divider",
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
      label: "Divider",
      order: 50,
    },
    {
      placement: "ending",
      category: "Navigation",
      label: "Divider",
      order: 10,
    },
  ],
  createField: createFieldFactory("divider", {
    label: "",
    required: false,
  }),
  renderCard: ({ dragHandle, field, isSelected, onSelect }) => (
    <DividerFieldCard
      dragHandle={dragHandle}
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
    />
  ),
  renderSettings: ({ field, onChange }) => (
    <div>
      <div className="mb-1 text-xs font-medium text-gray-600">Label (optional)</div>
      <input
        type="text"
        value={field.label ?? ""}
        onChange={(event) => onChange({ label: event.target.value || "" })}
        placeholder="Section label..."
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
      />
    </div>
  ),
});
