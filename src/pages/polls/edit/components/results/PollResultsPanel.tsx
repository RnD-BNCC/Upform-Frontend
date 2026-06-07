import { ArrowClockwise, Trophy } from "@phosphor-icons/react";
import { useQueryPollScores } from "@/api/polls";
import { Spinner } from "@/components/ui";
import type { LeaderboardEntry } from "@/types/polling";
import { getRankBadgeClass } from "@/pages/polls/edit/utils";

type PollResultsPanelProps = {
  pollId: string;
  title: string;
};

export default function PollResultsPanel({
  pollId,
  title,
}: PollResultsPanelProps) {
  const {
    data: scores = [],
    isFetching,
    isLoading,
    refetch,
  } = useQueryPollScores(pollId);
  const totalParticipants = scores.length;
  const topScore = scores[0]?.score ?? 0;
  const averageScore =
    totalParticipants > 0
      ? Math.round(
          scores.reduce((total, entry) => total + entry.score, 0) /
            totalParticipants,
        )
      : 0;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500">
              Poll Results
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Leaderboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Full ranking for {title || "Untitled Poll"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowClockwise
              size={14}
              weight="bold"
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Participants</p>
            <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
              {totalParticipants}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Top score</p>
            <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
              {topScore}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Average score</p>
            <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
              {averageScore}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} weight="fill" className="text-primary-500" />
              <p className="text-sm font-bold text-gray-900">All rankings</p>
            </div>
            <p className="text-xs text-gray-400">
              {totalParticipants} participant
              {totalParticipants === 1 ? "" : "s"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Spinner size={28} className="text-primary-500" />
              <p className="text-sm text-gray-400">Loading rankings...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <Trophy size={40} className="text-gray-200" weight="duotone" />
              <p className="text-sm font-bold text-gray-500">No rankings yet</p>
              <p className="max-w-sm text-xs leading-relaxed text-gray-400">
                Rankings will appear after participants answer scored poll
                questions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scores.map((entry: LeaderboardEntry, index) => {
                const rank = index + 1;

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[56px_1fr_110px] items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${getRankBadgeClass(
                        rank,
                      )}`}
                    >
                      {rank}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {entry.name || "Anonymous"}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        ID {entry.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900 tabular-nums">
                        {entry.score}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        points
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

