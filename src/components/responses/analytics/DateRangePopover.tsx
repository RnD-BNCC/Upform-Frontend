import { useEffect, useRef, useState } from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react";

export type AnalyticsDatePreset =
  | "all"
  | "today"
  | "last7"
  | "last4weeks"
  | "last12months"
  | "custom";

export type AnalyticsDateFilter = {
  endDate?: string;
  preset: AnalyticsDatePreset;
  startDate?: string;
};

type DateRangePopoverProps = {
  value: AnalyticsDateFilter;
  onChange: (value: AnalyticsDateFilter) => void;
};

const PRESETS: Array<{ label: string; value: AnalyticsDatePreset }> = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7" },
  { label: "Last 4 weeks", value: "last4weeks" },
  { label: "Last 12 months", value: "last12months" },
];

function getPresetLabel(value: AnalyticsDateFilter) {
  if (value.preset === "custom") return "Custom";
  return PRESETS.find((preset) => preset.value === value.preset)?.label ?? "All time";
}

export default function DateRangePopover({
  onChange,
  value,
}: DateRangePopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
      >
        <CalendarBlankIcon size={15} className="text-gray-500" />
        {getPresetLabel(value)}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[120] w-[360px] rounded-md border border-gray-200 bg-white shadow-xl">
          <div className="p-4">
            <p className="mb-3 text-sm font-semibold text-gray-500">Filter by date</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = value.preset === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onChange({ preset: preset.value })}
                    className={`h-9 rounded-md px-3 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-500">Custom range</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-gray-400">
              <input
                type="date"
                value={value.startDate ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    preset: "custom",
                    startDate: event.target.value || undefined,
                  })
                }
                className="min-w-0 bg-transparent text-sm text-gray-700 outline-none"
              />
              <span className="text-gray-400">-&gt;</span>
              <input
                type="date"
                value={value.endDate ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    preset: "custom",
                    endDate: event.target.value || undefined,
                  })
                }
                className="min-w-0 bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
