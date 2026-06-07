import { ArrowClockwise, Trash } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import type { Poll } from "@/types/polling";
import { formatDeletedAt } from "@/pages/polls/utils";
import AuditLine from "@/pages/polls/components/list/AuditLine";

type DeletedPollCardProps = {
  index: number;
  onRestore: (poll: Poll) => void;
  poll: Poll;
};

export default function DeletedPollCard({
  index,
  onRestore,
  poll,
}: DeletedPollCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
    >
      <div className="relative h-32 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-linear-to-br from-gray-700 via-gray-900 to-black" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute left-4 top-3 flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Trash size={12} weight="bold" />
          Deleted
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-4 pb-4 pt-10">
          <h3
            className="line-clamp-1 text-sm font-bold text-white"
            title={poll.title}
          >
            {poll.title || "Untitled Poll"}
          </h3>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-400">Deleted</span>
          <span className="font-semibold text-gray-700">
            {formatDeletedAt(poll.deletedAt)}
          </span>
        </div>
        <AuditLine label="Deleted by" value={poll.deletedBy} />
        <AuditLine label="Created by" value={poll.createdBy} />
        <AuditLine label="Updated by" value={poll.updatedBy} />
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-400">Slides</span>
          <span className="font-semibold text-gray-700">
            {poll.slides.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRestore(poll)}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-primary-600 px-3 text-xs font-bold text-white transition-colors hover:bg-primary-700"
        >
          <ArrowClockwise size={14} weight="bold" />
          Restore
        </button>
      </div>
    </motion.article>
  );
}

