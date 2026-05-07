import type { ReactNode } from "react";

type Props = {
  actions?: ReactNode;
  icon: ReactNode;
  name: string;
  meta?: string;
  count: number;
  countLabel: string;
  onClick: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export default function FolderItem({
  actions,
  icon,
  name,
  meta,
  count,
  countLabel,
  onClick,
  onContextMenu,
}: Props) {
  return (
    <div
      onContextMenu={onContextMenu}
      className="group relative rounded-xl border border-gray-200 bg-white transition-all hover:border-primary-200 hover:bg-gray-50"
    >
      <button
        onClick={onClick}
        className="flex w-full cursor-pointer flex-col gap-2 p-3 text-left"
      >
        <div className="flex items-start justify-between">
          <div className="text-primary-400 transition-colors group-hover:text-primary-500">
            {icon}
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
            {count}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold leading-snug text-gray-800">
            {name}
          </p>
          {meta && (
            <p className="mt-0.5 truncate text-[10px] text-gray-400">{meta}</p>
          )}
          <p className="text-[10px] text-gray-400">{countLabel}</p>
        </div>
      </button>
      {actions && (
        <div
          className="absolute bottom-2 right-2 flex items-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
