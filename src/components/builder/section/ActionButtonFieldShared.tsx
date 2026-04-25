import type { ReactNode } from "react";
import {
  ArrowsHorizontalIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@phosphor-icons/react";
import type { FormField } from "@/types/form";

const ALIGNMENT_OPTIONS = [
  { value: "left", Icon: TextAlignLeftIcon },
  { value: "center", Icon: TextAlignCenterIcon },
  { value: "right", Icon: TextAlignRightIcon },
  { value: "full", Icon: ArrowsHorizontalIcon },
] as const satisfies ReadonlyArray<{
  value: NonNullable<FormField["buttonAlign"]>;
  Icon: typeof TextAlignLeftIcon;
}>;

export function getActionButtonAlignClass(align?: FormField["buttonAlign"]) {
  if (align === "full") {
    return "";
  }

  if (align === "center") {
    return "justify-center";
  }

  if (align === "right") {
    return "justify-end";
  }

  return "justify-start";
}

export function FieldSettingLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <span className="text-xs font-medium text-gray-600">{children}</span>
      {required && <span className="text-xs text-red-500">*</span>}
    </div>
  );
}

export function ActionButtonAlignmentSelector({
  value,
  onChange,
}: {
  value?: FormField["buttonAlign"];
  onChange: (value: NonNullable<FormField["buttonAlign"]>) => void;
}) {
  return (
    <div className="flex gap-1">
      {ALIGNMENT_OPTIONS.map(({ value: optionValue, Icon }) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`flex flex-1 justify-center rounded-md border bg-white py-1.5 transition-colors ${
            (value ?? "left") === optionValue
              ? "border-primary-400 bg-primary-50 text-primary-600"
              : "border-gray-200 text-gray-400 hover:border-gray-300"
          }`}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}

export function ActionButtonColorField({
  label,
  value,
  defaultColor,
  onChange,
}: {
  label: string;
  value?: string;
  defaultColor: string;
  onChange: (value?: string) => void;
}) {
  return (
    <div>
      <FieldSettingLabel>{label}</FieldSettingLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? defaultColor}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || undefined)}
          placeholder={defaultColor}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
