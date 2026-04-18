import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "@phosphor-icons/react";

export type ThemeKey = "light" | "dark" | "eco-friendly" | "charcoal";

export const THEMES: {
  key: ThemeKey;
  label: string;
  canvasBg: string;
  bg: string;
  inputBg: string;
  inputBorder: string;
  btnBg: string;
  textColor: string;
  inputText: string;
}[] = [
  {
    key: "light",
    label: "Light",
    canvasBg: "#f5f5f5",
    bg: "#ffffff",
    inputBg: "#f9fafb",
    inputBorder: "#d1d5db",
    btnBg: "#0054a5",
    textColor: "#111827",
    inputText: "#6b7280",
  },
  {
    key: "dark",
    label: "Dark",
    canvasBg: "#111827",
    bg: "#1a1a2e",
    inputBg: "#16213e",
    inputBorder: "#374151",
    btnBg: "#3b82f6",
    textColor: "#f9fafb",
    inputText: "#9ca3af",
  },
  {
    key: "eco-friendly",
    label: "Eco-friendly",
    canvasBg: "#e8eee8",
    bg: "#f0f4f0",
    inputBg: "#ffffff",
    inputBorder: "#86efac",
    btnBg: "#16a34a",
    textColor: "#14532d",
    inputText: "#4b7c5a",
  },
  {
    key: "charcoal",
    label: "Charcoal",
    canvasBg: "#2d3748",
    bg: "#374151",
    inputBg: "#1f2937",
    inputBorder: "#4b5563",
    btnBg: "#111827",
    textColor: "#f9fafb",
    inputText: "#9ca3af",
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (theme: ThemeKey) => void;
  required?: boolean;
};

export default function ThemePickerModal({
  isOpen,
  onClose,
  onContinue,
  required,
}: Props) {
  const [selected, setSelected] = useState<ThemeKey>("light");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={required ? undefined : onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Choose a theme
              </h2>
            </div>

            {/* Themes grid */}
            <div className="overflow-y-auto p-6 grid grid-cols-2 gap-4">
              {THEMES.map((theme) => {
                const isSelected = selected === theme.key;
                return (
                  <motion.button
                    key={theme.key}
                    onClick={() => setSelected(theme.key)}
                    whileTap={{ scale: 0.98 }}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 ring-2 ring-primary-400 ring-offset-2 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 shadow-sm"
                    }`}
                    style={{ background: theme.bg }}
                  >
                    {/* Checkmark badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12l5 5 9-9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    <span
                      className="block text-xs font-semibold mb-3"
                      style={{ color: theme.textColor }}
                    >
                      {theme.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 rounded flex items-center gap-1.5 px-2 py-1.5 border text-xs"
                        style={{
                          background: theme.inputBg,
                          borderColor: theme.inputBorder,
                          color: theme.inputText,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>Text</span>
                      </div>
                      <div
                        className="rounded px-3 py-1.5 text-xs font-semibold text-white"
                        style={{ background: theme.btnBg }}
                      >
                        OK
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              {!required && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onContinue(selected)}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              >
                Create form
                <ArrowRightIcon size={14} weight="bold" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
