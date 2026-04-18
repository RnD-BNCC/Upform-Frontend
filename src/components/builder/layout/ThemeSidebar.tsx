import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { THEMES } from "../modals/ThemePickerModal";
import type { ThemeKey } from "../modals/ThemePickerModal";

type Props = {
  activeTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  onClose: () => void;
};

export default function ThemeSidebar({
  activeTheme,
  onThemeChange,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"current" | "all">("all");

  const displayThemes =
    tab === "current" ? THEMES.filter((t) => t.key === activeTheme) : THEMES;

  return (
    <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            Form designer
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XIcon size={14} weight="bold" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["current", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "current" ? "Current" : "All themes"}
          </button>
        ))}
      </div>

      {/* Themes list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {displayThemes.map((theme) => {
          const isActive = theme.key === activeTheme;
          return (
            <button
              key={theme.key}
              onClick={() => onThemeChange(theme.key)}
              className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                isActive
                  ? "border-primary-500 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ background: theme.bg }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: theme.textColor }}
                >
                  {theme.label}
                </span>
                {isActive && (
                  <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="flex-1 rounded flex items-center gap-1 px-2 py-1 border text-[10px]"
                  style={{
                    background: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0 }}
                  >
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Text</span>
                </div>
                <div
                  className="rounded px-2 py-1 text-[10px] font-semibold text-white"
                  style={{ background: theme.btnBg }}
                >
                  OK
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
