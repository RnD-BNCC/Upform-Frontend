import type { ReactNode } from "react";
import HelpTooltip from "@/components/builder/layout/shared/HelpTooltip";
import { stripHtmlToText } from "@/utils/form/referenceTokens";

export function FieldPluginToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
        checked ? "bg-primary-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function FieldPluginLabel({
  children,
  tooltip,
}: {
  children: ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <span className="text-xs font-medium text-gray-600">{children}</span>
      {tooltip ? (
        <HelpTooltip>{tooltip}</HelpTooltip>
      ) : null}
    </div>
  );
}

export function FieldPluginToggleRow({
  checked,
  label,
  onChange,
  tooltip,
}: {
  checked: boolean;
  label: ReactNode;
  onChange: (value: boolean) => void;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {tooltip ? (
          <HelpTooltip>{tooltip}</HelpTooltip>
        ) : null}
      </div>
      <FieldPluginToggle checked={checked} onChange={onChange} />
    </div>
  );
}

export function normalizeFieldSettingValue(value: string) {
  return stripHtmlToText(value) ? value : undefined;
}
