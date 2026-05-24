export const POLL_CARD_COLOR = "#0054a5";

export const POLL_STATUS_CONFIG: Record<
  string,
  { dot: string; label: string }
> = {
  active: { label: "Active", dot: "bg-emerald-400" },
  ended: { label: "Ended", dot: "bg-gray-400" },
  waiting: { label: "Waiting", dot: "bg-yellow-400" },
};

