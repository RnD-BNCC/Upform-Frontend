import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SpinnerGapIcon } from "@phosphor-icons/react";

type Props = {
  isOpen: boolean;
  isLoading?: boolean;
  onCreate: (name: string) => Promise<void>;
};

export default function PollRenameModal({
  isOpen,
  isLoading,
  onCreate,
}: Props) {
  const [name, setName] = useState("My poll");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      setName("My poll");
      inputRef.current?.select();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isLoading) return;
    await onCreate(name.trim());
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15 }}
            className="mx-4 w-full max-w-sm overflow-hidden rounded-sm bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 pb-4 pt-6">
              <h2 className="mb-4 text-base font-bold text-gray-900">
                Rename your poll
              </h2>
              <form onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-sm border border-primary-400 px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-300"
                  maxLength={80}
                  autoComplete="off"
                />
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={isLoading || !name.trim()}
                className="flex items-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <SpinnerGapIcon size={14} className="animate-spin" />
                ) : null}
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
