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
import type { PollAuditLog } from "@/types/polling";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
      {log.targetId ? (
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
