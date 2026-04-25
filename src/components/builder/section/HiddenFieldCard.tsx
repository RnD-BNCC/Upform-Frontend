import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { EyeSlashIcon } from "@phosphor-icons/react";

type HiddenFieldCardProps = {
  dragHandle: ReactNode;
  hasLabel: boolean;
  isSelected: boolean;
  labelHtml: string;
  required?: boolean;
  onSelect: HTMLAttributes<HTMLDivElement>["onClickCapture"];
};

export default function HiddenFieldCard({
  dragHandle,
  hasLabel,
  isSelected,
  labelHtml,
  required = false,
  onSelect,
}: HiddenFieldCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      onClickCapture={onSelect}
      className={`cursor-pointer rounded-xl border-2 border-dashed bg-gray-50 transition-all duration-150 ${
        isSelected
          ? "border-primary-400"
          : "border-gray-200 hover:border-primary-200"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        {dragHandle}
        <EyeSlashIcon size={14} className="shrink-0 text-gray-400" />
        <span className="flex-1 truncate text-sm italic text-gray-400">
          {hasLabel ? (
            <>
              <span dangerouslySetInnerHTML={{ __html: labelHtml }} />
              {required ? <span className="ml-1 text-red-500">*</span> : null}
            </>
          ) : (
            "Hidden field"
          )}
        </span>
        <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
          Hidden
        </span>
      </div>
    </motion.div>
  );
}
