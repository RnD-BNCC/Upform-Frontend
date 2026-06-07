import { motion } from "framer-motion";
import type { Poll } from "@/types/polling";
import DeletedPollCard from "@/pages/polls/components/list/DeletedPollCard";
import PollCard from "@/pages/polls/components/list/PollCard";

type PollGridProps = {
  isTrashTab: boolean;
  onContextMenu: (id: string, x: number, y: number) => void;
  onRestore: (poll: Poll) => void;
  polls: Poll[];
};

export default function PollGrid({
  isTrashTab,
  onContextMenu,
  onRestore,
  polls,
}: PollGridProps) {
  return (
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {polls.map((poll, index) =>
          isTrashTab ? (
            <DeletedPollCard
              key={poll.id}
              poll={poll}
              index={index}
              onRestore={onRestore}
            />
          ) : (
            <PollCard
              key={poll.id}
              poll={poll}
              index={index}
              onContextMenu={onContextMenu}
            />
          ),
        )}
      </div>
    </motion.div>
  );
}

