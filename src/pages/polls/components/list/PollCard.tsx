import { DotsThree } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Poll } from "@/types/polling";
import {
  POLL_CARD_COLOR,
  POLL_STATUS_CONFIG,
} from "@/pages/polls/constants";
import { formatPollUpdatedAt } from "@/pages/polls/utils";
import AuditLine from "@/pages/polls/components/list/AuditLine";

type PollCardProps = {
  index: number;
  onContextMenu: (id: string, x: number, y: number) => void;
  poll: Poll;
};

export default function PollCard({
  index,
  onContextMenu,
  poll,
}: PollCardProps) {
  const navigate = useNavigate();
  const status = POLL_STATUS_CONFIG[poll.status] ?? POLL_STATUS_CONFIG.waiting;

  const openMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onContextMenu(poll.id, event.clientX, event.clientY);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={() => navigate(`/polls/${poll.id}/edit`)}
      onContextMenu={(event) => {
        event.preventDefault();
        openMenu(event);
      }}
      className="group cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:shadow-gray-200/60"
    >
      <div
        className="relative h-32 overflow-hidden"
        style={{ backgroundColor: POLL_CARD_COLOR }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-black/35" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-black/10" />

        <div className="absolute left-4 top-3.5">
          <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <button
          type="button"
          onClick={openMenu}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 hover:bg-black/25 sm:opacity-0 sm:group-hover:opacity-100"
          title="More options"
        >
          <DotsThree size={18} weight="bold" className="text-white" />
        </button>

        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/40 to-transparent px-4 pb-4 pt-10">
          <h3 className="line-clamp-1 text-sm font-bold leading-snug text-white drop-shadow-sm">
            {poll.title || "Untitled Poll"}
          </h3>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium">Code:</span>
          <span className="font-bold tracking-wider text-gray-600">
            {poll.code}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-gray-800">
              {poll.slides.length}
            </span>
            <span className="text-[10px] text-gray-400">
              slide{poll.slides.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {formatPollUpdatedAt(poll.updatedAt)}
          </span>
        </div>
        <div className="space-y-1">
          <AuditLine label="Created by" value={poll.createdBy} />
          <AuditLine label="Updated by" value={poll.updatedBy} />
        </div>
      </div>
    </motion.div>
  );
}
