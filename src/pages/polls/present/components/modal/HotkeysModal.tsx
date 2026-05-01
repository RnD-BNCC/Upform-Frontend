import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";

export type HotkeyGroup = {
  rows: Array<{
    description: string;
    keyLabel: string;
  }>;
  title: string;
};

interface HotkeysModalProps {
  groups?: HotkeyGroup[];
  open: boolean;
  onClose: () => void;
  title?: string;
}

const DEFAULT_HOTKEY_GROUPS: HotkeyGroup[] = [
  {
    title: "Presenting",
    rows: [
      { keyLabel: "->", description: "Go to next slide" },
      { keyLabel: "<-", description: "Go to previous slide" },
      { keyLabel: "P", description: "Exit presentation" },
      { keyLabel: "Esc", description: "Exit / close overlay" },
      { keyLabel: "F", description: "Toggle fullscreen" },
      { keyLabel: "S", description: "Start quiz" },
      { keyLabel: "R", description: "Restart quiz" },
      { keyLabel: "B", description: "Show or hide blank screen" },
    ],
  },
  {
    title: "Participation",
    rows: [
      { keyLabel: "H", description: "Hide or show responses" },
      { keyLabel: "L", description: "Show joining code" },
      { keyLabel: "?", description: "Show keyboard shortcuts" },
      { keyLabel: "Q", description: "Toggle Q&A sidebar" },
      { keyLabel: "Up/Down", description: "Navigate Q&A questions" },
      { keyLabel: "Enter", description: "Mark Q&A as answered" },
    ],
  },
];

function HotkeyRow({
  keyLabel,
  description,
}: {
  keyLabel: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <kbd className="text-xs font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg min-w-9 text-center">
        {keyLabel}
      </kbd>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
}

export default function HotkeysModal({
  groups = DEFAULT_HOTKEY_GROUPS,
  open,
  onClose,
  title = "Keyboard Shortcuts",
}: HotkeysModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-800">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {groups.map((group) => (
                <div key={group.title}>
                  <h4 className="text-sm font-bold text-gray-800 mb-4">
                    {group.title}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {group.rows.map((row) => (
                      <HotkeyRow
                        key={`${group.title}-${row.keyLabel}-${row.description}`}
                        keyLabel={row.keyLabel}
                        description={row.description}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
