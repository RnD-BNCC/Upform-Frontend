import { MagnifyingGlass } from "@phosphor-icons/react";

type PollsToolbarProps = {
  isTrashTab: boolean;
  onSearchChange: (value: string) => void;
  search: string;
  total: number;
};

export default function PollsToolbar({
  isTrashTab,
  onSearchChange,
  search,
  total,
}: PollsToolbarProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-gray-900">
            {isTrashTab ? "Temporary Delete" : "All Polls"}
          </h2>
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-600">
            {total}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          {isTrashTab
            ? "Deleted polls are hidden from Live Polls and public access"
            : "Manage and track your polls"}
        </p>
      </div>

      <div className="relative flex-1 sm:flex-none">
        <MagnifyingGlass
          size={14}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={isTrashTab ? "Search deleted polls..." : "Search polls..."}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:w-52"
        />
      </div>
    </div>
  );
}

