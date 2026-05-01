import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { SelectPreviewIcon, ThemeCheckIcon } from "@/components/icons";
import { THEMES, type ThemeKey } from "@/utils/form/themeConfig";
import BaseModal from "@/components/ui/BaseModal";

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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      required={required}
      zIndex="z-[200]"
      duration={0.18}
      className="w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]"
    >
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Choose a theme</h2>
      </div>

      <div className="overflow-y-auto p-6 grid grid-cols-2 gap-4">
        {THEMES.map((theme) => {
          const isSelected = selected === theme.key;
          return (
            <motion.button
              key={theme.key}
              onClick={() => setSelected(theme.key)}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-sm border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-primary-500 ring-2 ring-primary-400 ring-offset-2 shadow-lg"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
              style={{ background: theme.bg }}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
                  <ThemeCheckIcon className="text-white" />
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
                  <SelectPreviewIcon style={{ flexShrink: 0 }} />
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
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-5 py-2 rounded-sm transition-colors"
        >
          Create form
          <ArrowRightIcon size={14} weight="bold" />
        </motion.button>
      </div>
    </BaseModal>
  );
}
