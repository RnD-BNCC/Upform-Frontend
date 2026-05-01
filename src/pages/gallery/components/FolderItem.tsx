import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  name: string;
  meta?: string;
  count: number;
  countLabel: string;
  onClick: () => void;
};

export default function FolderItem({
  icon,
  name,
  meta,
  count,
  countLabel,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-primary-200 transition-all cursor-pointer text-left group w-full"
    >
      <div className="flex items-start justify-between">
        <div className="text-primary-400 group-hover:text-primary-500 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate leading-snug">
          {name}
        </p>
        {meta && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{meta}</p>
        )}
        <p className="text-[10px] text-gray-400">{countLabel}</p>
      </div>
    </button>
  );
}

