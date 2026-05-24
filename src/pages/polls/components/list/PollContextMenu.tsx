import { useEffect, useRef } from "react";
import {
  ChatCircleText,
  Copy,
  PencilSimple,
  Presentation,
  Trash,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import type { Poll } from "@/types/polling";

type PollContextMenuProps = {
  onClose: () => void;
  onCopyCode: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMonitorQNA: () => void;
  onPresent: () => void;
  poll: Poll;
  x: number;
  y: number;
};

export default function PollContextMenu({
  onClose,
  onCopyCode,
  onDelete,
  onEdit,
  onMonitorQNA,
  onPresent,
  poll,
  x,
  y,
}: PollContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const adjustedX = Math.min(x, window.innerWidth - 204);
  const adjustedY = Math.min(y, window.innerHeight - 240);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.08, ease: "easeOut" }}
      className="fixed z-[100] w-40 select-none overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 pb-2 pt-2.5">
        <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          Poll
        </p>
        <p className="truncate text-[11px] font-semibold text-gray-800" title={poll.title}>
          {poll.title || "Untitled Poll"}
        </p>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="space-y-0.5 py-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit();
          }}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <PencilSimple
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onPresent();
          }}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <Presentation
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Present
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onMonitorQNA();
          }}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <ChatCircleText
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Q&A Monitor
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onCopyCode();
          }}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <Copy
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Copy Code
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:font-bold hover:text-red-700 active:bg-red-100"
        >
          <Trash
            size={12}
            className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
          />
          Delete
        </button>
      </div>
    </motion.div>
  );
}
