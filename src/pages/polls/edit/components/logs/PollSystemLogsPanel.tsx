import { useMemo, useState } from "react";
import {
  ArrowClockwiseIcon,
  FileTextIcon,
  PlusCircleIcon,
  TrashIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  useMutationRollbackPollAuditLog,
  useQueryPollAuditLogs,
} from "@/api/polls";
import { useMutationCreatePermissionRequest } from "@/api/permission-requests";
import {
  ConfirmModal,
  LoadingModal,
  StatusModal,
  type StatusType,
} from "@/components/modal";
import { Spinner } from "@/components/ui";
import type { Poll, PollAuditLog, PollSlide } from "@/types/polling";
import { getPermissionRequiredError } from "@/utils/permissionRequests";

const ACTION_LABELS: Record<string, string> = {
  "poll.created": "Poll created",
  "poll.deleted": "Poll deleted",
  "poll.restored": "Poll restored",
  "poll.rollback": "Rollback applied",
  "poll.updated": "Poll updated",
  "poll.votes_cleared": "Votes cleared",
  "slide.created": "Slide created",
  "slide.deleted": "Slide deleted",
  "slide.updated": "Slide updated",
  "slides.reordered": "Slides reordered",
};

const CHANGE_TONE_CLASSES: Record<PollLogChange["tone"], string> = {
  added: "border-emerald-100 bg-emerald-50 text-emerald-700",
  meta: "border-blue-100 bg-blue-50 text-blue-700",
  moved: "border-amber-100 bg-amber-50 text-amber-700",
  removed: "border-red-100 bg-red-50 text-red-700",
  system: "border-gray-200 bg-gray-50 text-gray-600",
  updated: "border-primary-100 bg-primary-50 text-primary-700",
};

type PollSnapshot = Partial<Poll> & Partial<PollSlide>;

type PollLogChange = {
  after?: string;
  before?: string;
  detail?: string;
  id: string;
  label: string;
  tone: "added" | "meta" | "moved" | "removed" | "system" | "updated";
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toSnapshot(value: unknown): PollSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as PollSnapshot;
}

function getSnapshotSlides(snapshot: PollSnapshot | null): PollSlide[] {
  return Array.isArray(snapshot?.slides) ? snapshot.slides : [];
}

function isSlideSnapshot(snapshot: PollSnapshot | null) {
  return Boolean(
    snapshot &&
      ("question" in snapshot ||
        "options" in snapshot ||
        ("type" in snapshot && "pollId" in snapshot)),
  );
}

function stripText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSlideType(value: unknown) {
  return String(value ?? "slide").replaceAll("_", " ");
}

function formatQuestion(value: unknown) {
  return stripText(value) || "Untitled question";
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (Array.isArray(value)) {
    if (value.length === 0) return "No items";
    return value.map((item) => stripText(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const size = Object.keys(value).length;
    return size === 0 ? "Empty" : `${size} setting${size > 1 ? "s" : ""}`;
  }
  return stripText(value);
}

function summarizeOptions(options: unknown) {
  if (!Array.isArray(options) || options.length === 0) return "No options";
  const visible = options.map((option) => stripText(option)).filter(Boolean);
  const shown = visible.slice(0, 3).join(", ");
  return visible.length > 3 ? `${shown} +${visible.length - 3} more` : shown;
}

function hasJsonChanged(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

function findSlide(snapshot: PollSnapshot | null, targetId?: string | null) {
  if (isSlideSnapshot(snapshot)) return snapshot as PollSlide;
  return getSnapshotSlides(snapshot).find((slide) => slide.id === targetId) ?? null;
}

function describeSlide(slide: PollSlide | null) {
  if (!slide) return "Unknown slide";
  return `${formatSlideType(slide.type)} - ${formatQuestion(slide.question)}`;
}

function getSlideChanges(
  beforeSlide: PollSlide | null,
  afterSlide: PollSlide | null,
  idPrefix: string,
) {
  const changes: PollLogChange[] = [];
  if (!beforeSlide || !afterSlide) return changes;

  if (formatQuestion(beforeSlide.question) !== formatQuestion(afterSlide.question)) {
    changes.push({
      after: formatQuestion(afterSlide.question),
      before: formatQuestion(beforeSlide.question),
      id: `${idPrefix}-question`,
      label: "Question text",
      tone: "updated",
    });
  }

  if (beforeSlide.type !== afterSlide.type) {
    changes.push({
      after: formatSlideType(afterSlide.type),
      before: formatSlideType(beforeSlide.type),
      id: `${idPrefix}-type`,
      label: "Slide type",
      tone: "updated",
    });
  }

  if (beforeSlide.locked !== afterSlide.locked) {
    changes.push({
      after: formatValue(afterSlide.locked),
      before: formatValue(beforeSlide.locked),
      id: `${idPrefix}-locked`,
      label: "Lock state",
      tone: "updated",
    });
  }

  if (hasJsonChanged(beforeSlide.options, afterSlide.options)) {
    changes.push({
      after: summarizeOptions(afterSlide.options),
      before: summarizeOptions(beforeSlide.options),
      id: `${idPrefix}-options`,
      label: "Options",
      tone: "updated",
    });
  }

  if (hasJsonChanged(beforeSlide.settings, afterSlide.settings)) {
    changes.push({
      after: formatValue(afterSlide.settings),
      before: formatValue(beforeSlide.settings),
      detail: "Timer, visuals, scoring, or advanced settings changed.",
      id: `${idPrefix}-settings`,
      label: "Slide settings",
      tone: "updated",
    });
  }

  if (beforeSlide.order !== afterSlide.order) {
    changes.push({
      after: `Position ${(afterSlide.order ?? 0) + 1}`,
      before: `Position ${(beforeSlide.order ?? 0) + 1}`,
      id: `${idPrefix}-order`,
      label: "Slide order",
      tone: "moved",
    });
  }

  return changes;
}

function getPollMetaChanges(before: PollSnapshot | null, after: PollSnapshot | null) {
  const changes: PollLogChange[] = [];
  if (!before || !after) return changes;

  const metaFields: Array<[keyof PollSnapshot, string]> = [
    ["title", "Poll title"],
    ["status", "Poll status"],
    ["currentSlide", "Current slide"],
    ["visibility", "Access"],
  ];

  for (const [key, label] of metaFields) {
    if (before[key] !== after[key]) {
      changes.push({
        after: formatValue(after[key]),
        before: formatValue(before[key]),
        id: `meta-${String(key)}`,
        label,
        tone: "meta",
      });
    }
  }

  if (hasJsonChanged(before.settings, after.settings)) {
    changes.push({
      after: formatValue(after.settings),
      before: formatValue(before.settings),
      detail: "Poll-level configuration changed.",
      id: "meta-settings",
      label: "Poll settings",
      tone: "meta",
    });
  }

  return changes;
}

function buildPollLogChanges(log: PollAuditLog) {
  const before = toSnapshot(log.beforeSnapshot);
  const after = toSnapshot(log.afterSnapshot);
  const changes: PollLogChange[] = [];

  if (log.action === "poll.votes_cleared") {
    return [
      {
        detail: "Participant votes, scores, and Q&A queue were cleared.",
        id: "votes-cleared",
        label: "Poll reset",
        tone: "system" as const,
      },
    ];
  }

  if (log.action === "poll.rollback") {
    return [
      {
        detail: `Restored from log ${formatValue(log.targetId)}.`,
        id: "rollback",
        label: "Rollback applied",
        tone: "system" as const,
      },
    ];
  }

  if (log.targetType === "slide") {
    const beforeSlide = findSlide(before, log.targetId);
    const afterSlide = findSlide(after, log.targetId);

    if (log.action === "slide.created" && afterSlide) {
      return [
        {
          after: describeSlide(afterSlide),
          id: "slide-created",
          label: "New slide",
          tone: "added" as const,
        },
      ];
    }

    if (log.action === "slide.deleted" && (beforeSlide || afterSlide)) {
      return [
        {
          before: describeSlide(beforeSlide ?? afterSlide),
          id: "slide-deleted",
          label: "Deleted slide",
          tone: "removed" as const,
        },
      ];
    }

    changes.push(...getSlideChanges(beforeSlide, afterSlide, "slide"));
  } else {
    changes.push(...getPollMetaChanges(before, after));

    const beforeSlides = getSnapshotSlides(before);
    const afterSlides = getSnapshotSlides(after);
    if (beforeSlides.length > 0 && afterSlides.length > 0) {
      const afterById = new Map(afterSlides.map((slide) => [slide.id, slide]));
      const beforeById = new Map(beforeSlides.map((slide) => [slide.id, slide]));

      beforeSlides.forEach((slide) => {
        const afterSlide = afterById.get(slide.id) ?? null;
        if (!afterSlide) {
          changes.push({
            before: describeSlide(slide),
            id: `removed-${slide.id}`,
            label: "Deleted slide",
            tone: "removed",
          });
          return;
        }
        changes.push(...getSlideChanges(slide, afterSlide, slide.id));
      });

      afterSlides.forEach((slide) => {
        if (!beforeById.has(slide.id)) {
          changes.push({
            after: describeSlide(slide),
            id: `added-${slide.id}`,
            label: "New slide",
            tone: "added",
          });
        }
      });
    }
  }

  if (log.action === "slides.reordered" && changes.length === 0) {
    changes.push({
      detail: "Slide positions were updated.",
      id: "slides-reordered",
      label: "Slide order",
      tone: "moved",
    });
  }

  return changes;
}

function getActionIcon(action: string) {
  if (action.includes("deleted") || action.includes("cleared")) {
    return <TrashIcon size={15} weight="bold" />;
  }
  if (action.includes("created") || action.includes("restored")) {
    return <PlusCircleIcon size={15} weight="bold" />;
  }
  return <FileTextIcon size={15} weight="bold" />;
}

function getActionClassName(action: string) {
  if (action.includes("deleted") || action.includes("cleared")) {
    return "bg-red-50 text-red-600";
  }
  if (action.includes("created") || action.includes("restored")) {
    return "bg-emerald-50 text-emerald-600";
  }
  return "bg-primary-50 text-primary-600";
}

function PollLogCard({
  log,
  onRollback,
  rollbackPending,
}: {
  log: PollAuditLog;
  onRollback: (log: PollAuditLog) => void;
  rollbackPending: boolean;
}) {
  const canRollback = log.action !== "poll.rollback" && Boolean(log.beforeSnapshot);
  const changes = buildPollLogChanges(log);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActionClassName(
              log.action,
            )}`}
          >
            {getActionIcon(log.action)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-950">
              {ACTION_LABELS[log.action] ?? log.action}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
              <span>{formatDate(log.createdAt)}</span>
              <span>-</span>
              <span className="inline-flex items-center gap-1">
                <UserCircleIcon size={13} weight="bold" />
                {log.actorEmail || "System"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold uppercase text-gray-500">
            {log.targetType}
          </div>
          {canRollback ? (
            <button
              type="button"
              disabled={rollbackPending}
              onClick={() => onRollback(log)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              <ArrowClockwiseIcon size={13} />
              Rollback
            </button>
          ) : null}
        </div>
      </div>

      {changes.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {changes.map((change) => (
            <div
              key={change.id}
              className={`rounded-md border px-3 py-2 ${CHANGE_TONE_CLASSES[change.tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-black">{change.label}</p>
                <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black uppercase">
                  {change.tone}
                </span>
              </div>
              {change.before !== undefined || change.after !== undefined ? (
                <div className="mt-2 grid gap-2 text-xs text-gray-700 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <div className="min-w-0 rounded bg-white/80 px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Before
                    </p>
                    <p className="mt-0.5 truncate font-semibold">
                      {change.before ?? "-"}
                    </p>
                  </div>
                  <span className="hidden items-center text-gray-300 sm:flex">
                    to
                  </span>
                  <div className="min-w-0 rounded bg-white/80 px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      After
                    </p>
                    <p className="mt-0.5 truncate font-semibold">
                      {change.after ?? "-"}
                    </p>
                  </div>
                </div>
              ) : null}
              {change.detail ? (
                <p className="mt-1.5 text-xs font-semibold text-gray-500">
                  {change.detail}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : log.targetId ? (
        <p className="mt-3 truncate rounded-md bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-400">
          Target ID: {log.targetId}
        </p>
      ) : null}
    </article>
  );
}

export default function PollSystemLogsPanel({
  pollId,
  title,
}: {
  pollId: string;
  title: string;
}) {
  const logsQuery = useQueryPollAuditLogs(pollId);
  const rollbackLog = useMutationRollbackPollAuditLog(pollId);
  const createPermissionRequest = useMutationCreatePermissionRequest();
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const [rollbackTarget, setRollbackTarget] = useState<PollAuditLog | null>(null);
  const [statusResult, setStatusResult] = useState<{
    description: string;
    title: string;
    type: StatusType;
  } | null>(null);
  const slideLogCount = useMemo(
    () => logs.filter((log) => log.targetType === "slide").length,
    [logs],
  );

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    const target = rollbackTarget;
    setRollbackTarget(null);

    try {
      await rollbackLog.mutateAsync(target.id);
      setStatusResult({
        type: "success",
        title: "Rollback Applied",
        description: `The poll has been restored to the version from ${formatDate(
          target.createdAt,
        )}.`,
      });
    } catch (error) {
      const permissionError = getPermissionRequiredError(error);
      if (permissionError) {
        createPermissionRequest.mutate({
          action: permissionError.action,
          reason: "Need to rollback poll changes",
          resourceId: permissionError.resourceId,
          resourceType: permissionError.resourceType,
        });
        setStatusResult({
          type: "success",
          title: "Permission Requested",
          description: "Your rollback request has been sent to the approver.",
        });
        return;
      }

      setStatusResult({
        type: "error",
        title: "Rollback Failed",
        description: "Something went wrong while applying the rollback.",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500">
              Poll Logs
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              System logs
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Full change history for {title || "Untitled Poll"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logsQuery.refetch()}
            className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowClockwiseIcon
              size={14}
              weight="bold"
              className={logsQuery.isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">Total logs</p>
              <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
                {logs.length}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">
                Slide changes
              </p>
              <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
                {slideLogCount}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">Last update</p>
              <p className="mt-1 truncate text-sm font-bold text-gray-900">
                {logs[0] ? formatDate(logs[0].createdAt) : "-"}
              </p>
            </div>
          </div>

          {logsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-16 text-gray-400 shadow-sm">
              <Spinner size={32} className="text-primary-500" />
              <p className="text-sm">Loading system logs...</p>
            </div>
          ) : logsQuery.isError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-5 text-sm font-semibold text-red-700">
              Failed to load system logs.
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
              <PlusCircleIcon size={32} className="text-gray-300" />
              <div>
                <p className="text-sm font-bold text-gray-600">No logs yet</p>
                <p className="mt-1 text-xs text-gray-400">
                  Poll edits, slide changes, and cleanup actions will show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <PollLogCard
                  key={log.id}
                  log={log}
                  onRollback={setRollbackTarget}
                  rollbackPending={rollbackLog.isPending}
                />
              ))}
            </div>
          )}
      </div>

      <ConfirmModal
        isOpen={!!rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={() => {
          void handleRollback();
        }}
        variant="warning"
        title="Rollback Poll?"
        description={
          rollbackTarget
            ? `This will restore the poll to the version from ${formatDate(
                rollbackTarget.createdAt,
              )}. Current changes may be overwritten.`
            : ""
        }
        confirmText="Rollback"
      />

      <LoadingModal
        isOpen={rollbackLog.isPending}
        title="Rolling back..."
        description="Please wait while we restore this poll version."
      />

      <StatusModal
        isOpen={!!statusResult}
        onClose={() => setStatusResult(null)}
        type={statusResult?.type ?? "success"}
        title={statusResult?.title ?? ""}
        description={statusResult?.description ?? ""}
      />
    </div>
  );
}
