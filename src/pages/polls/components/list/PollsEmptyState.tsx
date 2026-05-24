import { Presentation } from "@phosphor-icons/react";
import { motion } from "framer-motion";

type PollsEmptyStateProps = {
  debouncedSearch: string;
  isTrashTab: boolean;
};

export default function PollsEmptyState({
  debouncedSearch,
  isTrashTab,
}: PollsEmptyStateProps) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24"
    >
      <Presentation size={48} className="text-gray-300" />
      <div className="text-center">
        <p className="text-sm font-bold text-gray-500">
          {isTrashTab
            ? "No deleted polls"
            : debouncedSearch
              ? "No polls found"
              : "No polls yet"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {debouncedSearch
            ? `No results for "${debouncedSearch}". Try a different keyword.`
            : isTrashTab
              ? "Polls you delete will show up here."
              : "Create your first live poll to engage your audience."}
        </p>
      </div>
    </motion.div>
  );
}

