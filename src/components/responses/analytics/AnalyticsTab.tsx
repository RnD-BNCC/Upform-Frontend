import { useMemo, useState, type ComponentType } from "react";
import {
  ChartBarIcon,
  CheckSquareIcon,
  ClockIcon,
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  FormAnalyticsEvent,
  FormField,
  FormResponse,
  FormSection,
} from "@/types/form";
import type { ResultFilterGroup } from "@/types/results";
import { apiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import { RefreshButton } from "@/components/ui";
import { PAGE_TYPE_BADGE_CLASS, PAGE_TYPE_ICONS } from "@/constants";
import type { BuilderPageType } from "@/types/builder";
import {
  DEFAULT_FILTER_GROUP,
  countFilterConditions,
  evaluateFilterGroup,
} from "@/components/responses/database/resultsDatabaseUtils";
import {
  cleanResultLabel,
  getResponseTimestamp,
  getResultFields,
} from "@/components/responses/resultsResponseUtils";
import AnalyticsConditionPopover from "@/components/responses/analytics/AnalyticsConditionPopover";
import DateRangePopover, {
  type AnalyticsDateFilter,
} from "@/components/responses/analytics/DateRangePopover";
import { isWithinAnalyticsDateFilter } from "@/components/responses/analytics/dateRangeUtils";

type AnalyticsTabProps = {
  allFields: FormField[];
  analyticsEvents: FormAnalyticsEvent[];
  eventId: string;
  formTitle?: string;
  sections: FormSection[];
  onRefresh: () => void | Promise<void>;
};

type StatCardProps = {
  icon: ComponentType<{ size?: number; weight?: "fill" | "regular" }>;
  iconClassName: string;
  label: string;
  value: string | number;
};

const DEFAULT_DATE_FILTER: AnalyticsDateFilter = { preset: "all" };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatReportDate(value = new Date()) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getDateFilterLabel(filter: AnalyticsDateFilter) {
  if (filter.preset === "custom") {
    const start = filter.startDate || "Start";
    const end = filter.endDate || "End";
    return `${start} to ${end}`;
  }

  const labels: Record<string, string> = {
    all: "All time",
    last12months: "Last 12 months",
    last4weeks: "Last 4 weeks",
    last7: "Last 7 days",
    today: "Today",
  };
  return labels[filter.preset] ?? "All time";
}

function getSectionPageType(section: FormSection): BuilderPageType {
  return (section.pageType ?? "page") as BuilderPageType;
}

function formatDayKey(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function getSectionLabel(section: FormSection, index: number) {
  if (section.title?.trim()) return section.title.trim();
  if (section.pageType === "cover") return "Cover";
  if (section.pageType === "ending") return "Ending";
  return `Page ${index + 1}`;
}

function hasReachedSection(record: FormResponse, index: number) {
  if ((record.sectionHistory ?? []).includes(index)) return true;
  return (record.currentSectionIndex ?? 0) >= index;
}

function getAnalyticsEventTimestamp(event: FormAnalyticsEvent) {
  return event.occurredAt;
}

function getAnalyticsVisitorKey(event: FormAnalyticsEvent) {
  return event.respondentUuid ?? event.id;
}

function getAnalyticsSessionKey(event: FormAnalyticsEvent) {
  return event.sessionUuid ?? event.respondentUuid ?? event.id;
}

function getAnalyticsDeviceType(event: FormAnalyticsEvent) {
  return event.deviceType ?? "unknown";
}

function toAnalyticsResponse(event: FormAnalyticsEvent): FormResponse {
  return {
    answers: event.answers ?? {},
    completedAt: event.occurredAt,
    currentSectionId: event.sectionId,
    currentSectionIndex: event.sectionIndex,
    deviceType: event.deviceType,
    id: event.id,
    progressPercent: event.progressPercent,
    respondentUuid: event.respondentUuid,
    sectionHistory: event.sectionHistory ?? [],
    status: "submitted",
    submittedAt: event.occurredAt,
    updatedAt: event.occurredAt,
    userAgent: event.userAgent,
  };
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
}: StatCardProps) {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-md border border-gray-200 bg-white px-4 shadow-sm">
      <span className={`flex h-11 w-11 items-center justify-center rounded-md ${iconClassName}`}>
        <Icon size={20} weight="fill" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-gray-500">{label}</span>
        <span className="block text-lg font-bold leading-tight text-gray-950">
          {value}
        </span>
      </span>
    </div>
  );
}

export default function AnalyticsTab({
  allFields,
  analyticsEvents,
  eventId,
  formTitle = "Untitled form",
  onRefresh,
  sections,
}: AnalyticsTabProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dateFilter, setDateFilter] =
    useState<AnalyticsDateFilter>(DEFAULT_DATE_FILTER);
  const [conditionFilter, setConditionFilter] =
    useState<ResultFilterGroup>(DEFAULT_FILTER_GROUP);
  const resultFields = useMemo(() => getResultFields(allFields), [allFields]);
  const conditionCount = useMemo(
    () => countFilterConditions(conditionFilter),
    [conditionFilter],
  );

  const analyticsData = useMemo(() => {
    const dateFilteredEvents = analyticsEvents.filter((event) =>
      isWithinAnalyticsDateFilter(getAnalyticsEventTimestamp(event), dateFilter),
    );
    const finishEvents = dateFilteredEvents.filter((event) => event.type === "finish");
    const matchingSessionIds =
      conditionCount > 0
        ? new Set(
            finishEvents
              .filter((event) =>
                evaluateFilterGroup(toAnalyticsResponse(event), conditionFilter),
              )
              .map(getAnalyticsSessionKey),
          )
        : null;
    const events = matchingSessionIds
      ? dateFilteredEvents.filter((event) =>
          matchingSessionIds.has(getAnalyticsSessionKey(event)),
        )
      : dateFilteredEvents;
    const submitted = events
      .filter((event) => event.type === "finish")
      .map(toAnalyticsResponse);
    const viewEvents = events.filter((event) => event.type === "view");
    const sectionEvents = events.filter((event) => event.type === "section_view");
    const startEvents = events.filter((event) => event.type === "start");
    const finishedSessions = new Set(
      events
        .filter((event) => event.type === "finish")
        .map(getAnalyticsSessionKey),
    );
    const startedSessions = new Set(startEvents.map(getAnalyticsSessionKey));
    finishedSessions.forEach((sessionId) => startedSessions.delete(sessionId));
    const visitorEvents = viewEvents.length > 0 ? viewEvents : events;
    const uniqueVisitors = new Set(visitorEvents.map(getAnalyticsVisitorKey)).size;

    return {
      events,
      sectionEvents,
      startedCount: startedSessions.size,
      submitted,
      uniqueVisitors,
      visitorEvents,
    };
  }, [analyticsEvents, conditionCount, conditionFilter, dateFilter]);

  const submitted = analyticsData.submitted;
  const uniqueVisitors = analyticsData.uniqueVisitors;
  const completionRate =
    uniqueVisitors > 0 ? (submitted.length / uniqueVisitors) * 100 : 0;

  const submissionsByDay = useMemo(() => {
    const counts = new Map<string, number>();
    submitted.forEach((response) => {
      const key = formatDayKey(getResponseTimestamp(response));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    if (counts.size === 0) return [{ day: "No data", submissions: 0 }];
    return Array.from(counts.entries()).map(([day, submissions]) => ({
      day,
      submissions,
    }));
  }, [submitted]);

  const startedCount = analyticsData.startedCount;

  const pageDropOffs = useMemo(() => {
    const visibleSections = sections.length > 0 ? sections : [];
    return visibleSections.map((section, index) => {
      const viewKeys = new Set(
        analyticsData.sectionEvents
          .filter((event) => event.sectionIndex === index)
          .map(getAnalyticsVisitorKey),
      );
      const submissions = submitted.filter((response) =>
        section.pageType === "ending" ? true : hasReachedSection(response, index),
      ).length;
      const views = section.pageType === "ending" ? submitted.length : viewKeys.size;
      return {
        id: section.id,
        dropOffs: Math.max(views - submissions, 0),
        label: getSectionLabel(section, index),
        pageType: getSectionPageType(section),
        submissions,
        views,
      };
    });
  }, [
    analyticsData.sectionEvents,
    sections,
    submitted,
  ]);

  const deviceRows = useMemo(() => {
    const counts = new Map<string, number>([
      ["Desktop", 0],
      ["Tablet", 0],
      ["Mobile", 0],
      ["Unknown", 0],
    ]);
    const countedVisitors = new Set<string>();
    analyticsData.visitorEvents.forEach((event) => {
      const visitorId = getAnalyticsVisitorKey(event);
      if (countedVisitors.has(visitorId)) return;
      countedVisitors.add(visitorId);
      const device = getAnalyticsDeviceType(event);
      const label = device[0].toUpperCase() + device.slice(1);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([label, count]) => label !== "Unknown" || count > 0)
      .map(([label, count]) => ({ count, label }));
  }, [analyticsData.visitorEvents]);

  const handleDownloadPdf = async () => {
    if (!eventId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);

    try {
      const payload = {
        conditionCount,
        dateRangeLabel: getDateFilterLabel(dateFilter),
        deviceRows,
        formTitle,
        metrics: [
          { label: "Unique visitors", value: String(uniqueVisitors) },
          { label: "Started", value: String(startedCount) },
          { label: "Finished", value: String(submitted.length) },
          {
            label: "Completion rate",
            value: `${completionRate.toFixed(completionRate < 10 ? 2 : 0)}%`,
          },
        ],
        pageDropOffs: pageDropOffs.map((row) => ({
          dropOffs: row.dropOffs,
          label: cleanResultLabel(row.label),
          submissions: row.submissions,
          views: row.views,
        })),
        submissionsByDay,
      };
      const { data } = await apiClient.post<Blob>(
        Api.eventAnalyticsReport(eventId),
        payload,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(formTitle || "analytics-report")
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, "-")}-analytics-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingPdf(false);
    }

    return;
    const reportTitle = `${formTitle || "Untitled form"} Analytics Report`;
    const deviceTotal = deviceRows.reduce((sum, item) => sum + item.count, 0);
    const maxSubmissions = Math.max(
      ...submissionsByDay.map((item) => item.submissions),
      1,
    );
    const maxPageViews = Math.max(...pageDropOffs.map((item) => item.views), 1);

    const metricCards = [
      ["Unique visitors", uniqueVisitors],
      ["Started", startedCount],
      ["Finished", submitted.length],
      [
        "Completion rate",
        `${completionRate.toFixed(completionRate < 10 ? 2 : 0)}%`,
      ],
    ];

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Inter, Arial, sans-serif; background: #fff; }
    .report { width: 100%; }
    .header { border-bottom: 2px solid #0f5ea8; padding-bottom: 18px; margin-bottom: 22px; }
    .eyebrow { color: #0f5ea8; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 6px 0 6px; font-size: 28px; line-height: 1.15; }
    .meta { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0 24px; }
    .metric { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; min-height: 76px; }
    .metric-label { color: #6b7280; font-size: 11px; font-weight: 700; }
    .metric-value { margin-top: 8px; font-size: 22px; font-weight: 900; }
    .section { break-inside: avoid; margin-top: 22px; }
    h2 { margin: 0 0 10px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #d1d5db; padding: 8px; }
    td { border-bottom: 1px solid #eef2f7; padding: 9px 8px; vertical-align: middle; }
    .bar-track { height: 8px; border-radius: 999px; background: #eef2f7; overflow: hidden; }
    .bar { height: 100%; border-radius: 999px; background: #0f5ea8; }
    .muted { color: #6b7280; }
    .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #9ca3af; font-size: 10px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <main class="report">
    <section class="header">
      <div class="eyebrow">UpForm analytics</div>
      <h1>${escapeHtml(reportTitle)}</h1>
      <div class="meta">
        Generated ${escapeHtml(formatReportDate())}<br />
        Date range: ${escapeHtml(getDateFilterLabel(dateFilter))}
        ${conditionCount > 0 ? `<br />Filtered by ${conditionCount} condition${conditionCount === 1 ? "" : "s"}` : ""}
      </div>
    </section>

    <section class="metrics">
      ${metricCards
        .map(
          ([label, value]) => `<div class="metric">
            <div class="metric-label">${escapeHtml(String(label))}</div>
            <div class="metric-value">${escapeHtml(String(value))}</div>
          </div>`,
        )
        .join("")}
    </section>

    <section class="section">
      <h2>Completed Submissions By Day</h2>
      <table>
        <thead><tr><th>Day</th><th>Finished</th><th style="width: 50%;">Trend</th></tr></thead>
        <tbody>
          ${submissionsByDay
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.day)}</td>
                <td><strong>${row.submissions}</strong></td>
                <td><div class="bar-track"><div class="bar" style="width:${Math.max((row.submissions / maxSubmissions) * 100, row.submissions > 0 ? 5 : 0)}%"></div></div></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Page Drop-Off Rates</h2>
      <table>
        <thead><tr><th>Page</th><th>Views</th><th>Submissions</th><th>Drop-offs</th><th style="width: 28%;">Reach</th></tr></thead>
        <tbody>
          ${pageDropOffs
            .map(
              (row) => `<tr>
                <td>${escapeHtml(cleanResultLabel(row.label))}</td>
                <td>${row.views}</td>
                <td>${row.submissions}</td>
                <td>${row.dropOffs}</td>
                <td><div class="bar-track"><div class="bar" style="width:${Math.max((row.views / maxPageViews) * 100, row.views > 0 ? 5 : 0)}%"></div></div></td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Device Mix</h2>
      <table>
        <thead><tr><th>Device</th><th>Visitors</th><th>Share</th><th style="width: 44%;">Distribution</th></tr></thead>
        <tbody>
          ${deviceRows
            .map((row) => {
              const percent = deviceTotal > 0 ? (row.count / deviceTotal) * 100 : 0;
              return `<tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${row.count}</td>
                <td>${percent.toFixed(percent < 10 ? 1 : 0)}%</td>
                <td><div class="bar-track"><div class="bar" style="width:${Math.max(percent, row.count > 0 ? 5 : 0)}%"></div></div></td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </section>

    <div class="footer">Prepared with UpForm. This report reflects the current analytics filters at export time.</div>
  </main>
  <script>
    window.addEventListener("load", function () {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;

    const reportWindow = window.open("", "_blank", "width=960,height=720");
    if (!reportWindow) return;
    reportWindow?.document.open();
    reportWindow?.document.write(html);
    reportWindow?.document.close();
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-7">
        <div className="flex items-center gap-2">
          <ChartBarIcon size={18} weight="fill" />
          <span className="text-lg font-bold text-gray-950">Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <DownloadSimpleIcon size={14} weight="bold" />
            {isDownloadingPdf ? "Preparing..." : "Download PDF"}
          </button>
          <RefreshButton
            onRefresh={onRefresh}
            ariaLabel="Refresh analytics"
          />
          <AnalyticsConditionPopover
            fields={resultFields}
            value={conditionFilter}
            onApply={setConditionFilter}
          />
          <DateRangePopover value={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-7 py-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard
            icon={UserCircleIcon}
            iconClassName="bg-violet-100 text-violet-600"
            label="Unique visitors"
            value={uniqueVisitors}
          />
          <StatCard
            icon={FileTextIcon}
            iconClassName="bg-pink-100 text-pink-600"
            label="Started"
            value={startedCount}
          />
          <StatCard
            icon={CheckSquareIcon}
            iconClassName="bg-emerald-100 text-emerald-600"
            label="Finished"
            value={submitted.length}
          />
          <StatCard
            icon={ChartBarIcon}
            iconClassName="bg-amber-100 text-amber-600"
            label="Completion rate"
            value={`${completionRate.toFixed(completionRate < 10 ? 2 : 0)}%`}
          />
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-950">
              Completed submissions by day
            </h3>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
              {submitted.length} finished
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsByDay}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  name="Number of Submissions"
                  stroke="#f2bf3d"
                  strokeWidth={3}
                  dot={{ fill: "#f2bf3d", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-5">
              <h3 className="text-base font-bold text-gray-950">
                Page drop-off rates
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {pageDropOffs.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(160px,1fr)_120px_150px_130px] items-center gap-3 px-5 py-4 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${PAGE_TYPE_BADGE_CLASS[row.pageType]}`}
                    >
                      {PAGE_TYPE_ICONS[row.pageType]}
                    </span>
                    <span className="truncate text-base font-bold text-gray-950">
                      {cleanResultLabel(row.label)}
                    </span>
                  </div>
                  <span className="font-bold text-gray-950">
                    {row.views} <span className="font-semibold text-gray-500">views</span>
                  </span>
                  <span className="font-bold text-gray-950">
                    {row.submissions}{" "}
                    <span className="font-semibold text-gray-500">submissions</span>
                  </span>
                  <span className="font-bold text-gray-950">
                    {row.dropOffs}{" "}
                    <span className="font-semibold text-gray-500">
                      drop off{row.dropOffs === 1 ? "" : "s"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-950">
              Submissions by device
            </h3>
            <div className="mt-7 space-y-2">
              {deviceRows.map((row) => {
                const Icon =
                  row.label === "Mobile"
                    ? DeviceMobileIcon
                    : row.label === "Tablet"
                      ? DeviceTabletIcon
                      : row.label === "Desktop"
                        ? DesktopIcon
                        : ClockIcon;
                const total = deviceRows.reduce((sum, item) => sum + item.count, 0);
                const width = total > 0 ? Math.max((row.count / total) * 100, 4) : 4;
                return (
                  <div key={row.label} className="relative overflow-hidden rounded-md bg-gray-50">
                    <div
                      className="absolute inset-y-0 left-0 bg-gray-100"
                      style={{ width: `${width}%` }}
                    />
                    <div className="relative flex h-10 items-center gap-3 px-3 text-sm">
                      <Icon size={16} weight="fill" className="text-gray-400" />
                      <span className="font-medium text-gray-700">{row.label}</span>
                      <span className="ml-auto font-bold text-gray-600">{row.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
