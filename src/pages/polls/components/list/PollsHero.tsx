import type { PollTab } from "@/pages/polls/types";

type PollsHeroProps = {
  activeTab: PollTab;
  deletedCount: number;
  onTabChange: (tab: PollTab) => void;
  totalCount: number;
};

export default function PollsHero({
  activeTab,
  deletedCount,
  onTabChange,
  totalCount,
}: PollsHeroProps) {
  const tabs: Array<{ count: number; key: PollTab; label: string }> = [
    { key: "polls", label: "Polls", count: totalCount },
    { key: "trash", label: "Temporary Delete", count: deletedCount },
  ];

  return (
    <div className="relative">
      <div className="flex flex-col gap-6 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:pb-8">
        <div>
          <p className="mb-1 text-sm font-bold text-primary-300">
            Live Polling
          </p>
          <h1 className="text-[1.75rem] font-bold leading-tight text-white sm:text-[2rem]">
            My Polls
          </h1>
          <p className="mt-1.5 text-sm text-white">
            Create interactive live polls for your audience.
          </p>
        </div>
        <div className="flex w-full shrink-0 items-stretch divide-x divide-white/10 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm sm:w-auto">
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 sm:flex-none sm:gap-1.5 sm:px-8 sm:py-5">
            <span className="text-2xl font-black leading-none tracking-tight text-white tabular-nums sm:text-[2.25rem]">
              {totalCount}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 sm:text-[11px]">
              Total Polls
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 sm:flex-none sm:gap-1.5 sm:px-8 sm:py-5">
            <span className="text-2xl font-black leading-none tracking-tight text-white tabular-nums sm:text-[2.25rem]">
              {deletedCount}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 sm:text-[11px]">
              Deleted
            </span>
          </div>
        </div>
      </div>

      <div className="-mx-4 flex px-4 sm:-mx-8 sm:px-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-white text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/50"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
