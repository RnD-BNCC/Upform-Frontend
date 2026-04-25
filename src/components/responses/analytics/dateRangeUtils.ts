import type { AnalyticsDateFilter } from "./DateRangePopover";

export function getAnalyticsDateRange(filter: AnalyticsDateFilter) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (filter.preset === "all") return { end: null, start: null };
  if (filter.preset === "today") return { end, start };
  if (filter.preset === "last7") start.setDate(start.getDate() - 6);
  if (filter.preset === "last4weeks") start.setDate(start.getDate() - 27);
  if (filter.preset === "last12months") start.setMonth(start.getMonth() - 12);
  if (filter.preset === "custom") {
    return {
      end: filter.endDate ? new Date(`${filter.endDate}T23:59:59.999`) : null,
      start: filter.startDate
        ? new Date(`${filter.startDate}T00:00:00.000`)
        : null,
    };
  }
  return { end, start };
}

export function isWithinAnalyticsDateFilter(
  value: string | undefined,
  filter: AnalyticsDateFilter,
) {
  if (!value) return true;
  const { end, start } = getAnalyticsDateRange(filter);
  if (!start && !end) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return true;
  if (start && timestamp < start.getTime()) return false;
  if (end && timestamp > end.getTime()) return false;
  return true;
}
