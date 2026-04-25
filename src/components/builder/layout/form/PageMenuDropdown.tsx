import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { PAGE_TYPE_BADGE_CLASS, PAGE_TYPE_ICONS } from "@/constants";
import type { BuilderPageType } from "@/types/builder";

export type PageMenuDropdownOption = {
  id: string;
  label: string;
  pageType?: BuilderPageType;
  icon?: ReactNode;
  iconClassName?: string;
};

type Props = {
  activeId?: string | null;
  className?: string;
  onSelect: (id: string) => void;
  options: PageMenuDropdownOption[];
  showIcons?: boolean;
  title?: string;
  variant?: "default" | "field";
};

export default function PageMenuDropdown({
  activeId,
  className = "rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg",
  onSelect,
  options,
  showIcons = true,
  title,
  variant = "default",
}: Props) {
  const isFieldVariant = variant === "field";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -6 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={className}
    >
      {title ? (
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </p>
      ) : null}

      {options.map((option) => {
        const isActive = option.id === activeId;
        const icon = option.icon ?? (option.pageType ? PAGE_TYPE_ICONS[option.pageType] : null);
        const iconClassName =
          option.iconClassName ??
          (option.pageType
            ? isFieldVariant
              ? isActive
                ? "bg-primary-100 text-primary-700"
                : PAGE_TYPE_BADGE_CLASS[option.pageType]
              : isActive
                ? "bg-white/15 text-white"
                : PAGE_TYPE_BADGE_CLASS[option.pageType]
            : "border border-gray-200 bg-white text-gray-500");

        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
              isFieldVariant
                ? `mx-1 my-0.5 w-[calc(100%-0.5rem)] rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? "bg-primary-50 font-medium text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                : `${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  } w-full px-3 py-2`
            }`}
          >
            {showIcons && icon ? (
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconClassName}`}
              >
                {icon}
              </span>
            ) : null}
            <span className="truncate text-xs font-semibold">{option.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
