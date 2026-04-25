import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowSquareOut,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { FormEvent } from "@/types/form";

type Props = {
  x: number;
  y: number;
  event: FormEvent;
  onClose: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
};

const PUBLISH_ACTIONS: Record<FormEvent["status"], { label: string; Icon: Icon }> = {
  active: { label: "Unpublish", Icon: XCircle },
  draft: { label: "Publish", Icon: CheckCircle },
  closed: { label: "Reopen", Icon: ArrowCounterClockwise },
};

export default function ContextMenu({
  x,
  y,
  event,
  onClose,
  onOpen,
  onEdit,
  onDelete,
  onToggleStatus,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { label: publishLabel, Icon: PublishIcon } = PUBLISH_ACTIONS[event.status];

  const adjustedX = Math.min(x, window.innerWidth - 204);
  const adjustedY = Math.min(y, window.innerHeight - 190);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
      className="fixed z-[100] w-40 overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] select-none"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 pt-2.5 pb-2">
        <p className="mb-0.5 text-[9px] font-semibold tracking-widest text-gray-400 uppercase">
          Form
        </p>
        <p
          className="truncate text-[11px] font-semibold text-gray-800"
          title={event.name}
        >
          {event.name}
        </p>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="space-y-0.5 py-1">
        <button
          onClick={onOpen}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <ArrowSquareOut
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Open
        </button>

        <button
          onClick={onEdit}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <PencilSimple
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Edit
        </button>

        <button
          onClick={onToggleStatus}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        >
          <PublishIcon
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          {publishLabel}
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="py-1">
        <button
          onClick={onDelete}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 hover:font-bold active:bg-red-100"
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
