import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";

interface HotkeysModalProps {
  open: boolean;
  onClose: () => void;
}

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

export default function HotkeysModal({ open, onClose }: HotkeysModalProps) {
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
              <h3 className="text-base font-bold text-gray-800">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">
                  Presenting
                </h4>
                <div className="flex flex-col gap-3">
                  <HotkeyRow keyLabel="→" description="Go to next slide" />
                  <HotkeyRow keyLabel="←" description="Go to previous slide" />
                  <HotkeyRow keyLabel="P" description="Exit presentation" />
                  <HotkeyRow keyLabel="Esc" description="Exit / close overlay" />
                  <HotkeyRow keyLabel="F" description="Toggle fullscreen" />
                  <HotkeyRow keyLabel="S" description="Start quiz" />
                  <HotkeyRow keyLabel="R" description="Restart quiz" />
                  <HotkeyRow keyLabel="B" description="Show or hide blank screen" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">
                  Participation
                </h4>
                <div className="flex flex-col gap-3">
                  <HotkeyRow keyLabel="H" description="Hide or show responses" />
                  <HotkeyRow keyLabel="L" description="Show joining code" />
                  <HotkeyRow keyLabel="?" description="Show keyboard shortcuts" />
                  <HotkeyRow keyLabel="Q" description="Toggle Q&A sidebar" />
                  <HotkeyRow keyLabel="↑/↓" description="Navigate Q&A questions" />
                  <HotkeyRow keyLabel="Enter" description="Mark Q&A as answered" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
