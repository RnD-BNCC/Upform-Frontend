const RANK_BADGES = [
  "bg-amber-400 text-amber-950",
  "bg-slate-300 text-slate-900",
  "bg-orange-300 text-orange-950",
];

export function getRankBadgeClass(rank: number) {
  return RANK_BADGES[rank - 1] ?? "bg-gray-100 text-gray-500";
}

