import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { THEME_PRESETS, type ThemePreset } from "@/config/polling";

type Props = {
  defaultTheme: ThemePreset;
  isOpen: boolean;
  onContinue: (theme: ThemePreset) => void;
};

export default function PollThemePickerModal({
  defaultTheme,
  isOpen,
  onContinue,
}: Props) {
  const [selectedId, setSelectedId] = useState(defaultTheme.id);
  const selectedTheme =
    THEME_PRESETS.find((theme) => theme.id === selectedId) ?? defaultTheme;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-100 px-6 pb-4 pt-6">
              <h2 className="text-base font-bold text-gray-900">
                Choose a theme
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 overflow-y-auto p-6">
              {THEME_PRESETS.map((theme) => {
                const isSelected = selectedId === theme.id;

                return (
                  <motion.button
                    key={theme.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedId(theme.id)}
                    className={`relative rounded-sm border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 ring-2 ring-primary-400 ring-offset-2 shadow-lg"
                        : "border-gray-200 shadow-sm hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: theme.bgColor }}
                  >
                    {isSelected ? (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm">
                        <Check size={12} weight="bold" />
                      </div>
                    ) : null}

                    <span
                      className="mb-3 block text-xs font-semibold"
                      style={{ color: theme.textColor }}
                    >
                      {theme.name}
                    </span>
                    <div className="flex h-16 items-end gap-2 rounded bg-white/10 p-2">
                      {theme.barColors.map((color, index) => (
                        <span
                          key={`${theme.id}-${color}`}
                          className="flex-1 rounded-sm"
                          style={{
                            backgroundColor: color,
                            height: `${38 + index * 18}%`,
                          }}
                        />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onContinue(selectedTheme)}
                className="flex items-center gap-2 rounded-sm bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Create poll
                <ArrowRight size={14} weight="bold" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
