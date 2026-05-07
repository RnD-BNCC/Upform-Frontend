import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

export type GalleryContextAction = {
  danger?: boolean;
  disabled?: boolean;
  Icon: Icon;
  label: string;
  onClick: () => void;
};

type Props = {
  actions: GalleryContextAction[];
  kind: string;
  onClose: () => void;
  subtitle?: string;
  title: string;
  x: number;
  y: number;
};

export default function GalleryContextMenu({
  actions,
  kind,
  onClose,
  subtitle,
  title,
  x,
  y,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const adjustedX = Math.max(8, Math.min(x, window.innerWidth - 220));
  const adjustedY = Math.max(
    8,
    Math.min(y, window.innerHeight - (96 + actions.length * 34)),
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
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
      className="fixed z-[120] w-44 overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] select-none"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 pt-2.5 pb-2">
        <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          {kind}
        </p>
        <p className="truncate text-[11px] font-semibold text-gray-800" title={title}>
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[10px] text-gray-400">{subtitle}</p>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      <div className="space-y-0.5 py-1">
        {actions.map(({ danger, disabled, Icon, label, onClick }) => (
          <button
            key={label}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onClick();
              onClose();
            }}
            className={`group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              danger
                ? "text-red-500 hover:bg-red-50 hover:text-red-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon
              size={12}
              className={`shrink-0 ${
                danger ? "text-red-400" : "text-gray-400 group-hover:text-gray-600"
              }`}
            />
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
