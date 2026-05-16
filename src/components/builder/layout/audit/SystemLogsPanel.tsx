import { useMemo, useState } from "react";
import {
  ArrowClockwiseIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
  PencilSimpleIcon,
  PlusCircleIcon,
  TrashIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  useMutationRollbackEventAuditLog,
  useQueryEventAuditLogs,
} from "@/api/events";
import { useMutationCreatePermissionRequest } from "@/api/permission-requests";
import {
  ConfirmModal,
  LoadingModal,
  StatusModal,
  type StatusType,
} from "@/components/modal";
import { RefreshButton, Spinner } from "@/components/ui";
import { getFieldPlugin } from "@/components/builder/section/fieldRegistry";
import { stripHtmlToText } from "@/utils/form/referenceTokens";
import { getPermissionRequiredError } from "@/utils/permissionRequests";
import type { ShareToast } from "@/types/builderShare";
import type { FormAuditLog } from "@/types/api";
import type { FieldType, FormField } from "@/types/form";

const ACTION_LABELS: Record<string, string> = {
  "builder.save": "Builder saved",
  "form.delete": "Form deleted",
  "form.rollback": "Rollback applied",
  "form.update": "Form updated",
  "response.delete": "Respondent deleted",
  "response.update": "Respondent updated",
  "responseProgress.delete": "Respondent draft deleted",
  "responseProgress.update": "Respondent draft updated",
};

const META_LABELS: Record<string, string> = {
  color: "Theme color",
  image: "Cover image",
  name: "Form title",
  status: "Form status",
  theme: "Theme",
};

const FIELD_CHANGE_KEYS: Array<keyof FormField> = [
  "label",
  "description",
  "required",
  "placeholder",
  "options",
  "defaultValue",
  "scaleMin",
  "scaleMax",
  "minLabel",
  "maxLabel",
  "validationMinLength",
  "validationMaxLength",
  "validationPattern",
  "validationEmailDomain",
  "validationMinSelection",
  "validationMaxSelection",
  "allowedFileTypes",
  "maxFileCount",
  "maxFileSizeMb",
  "conditionMode",
  "conditionTree",
  "branches",
  "headerImage",
  "imageCaption",
  "buttonUrl",
  "subtitle",
];

type SnapshotSection = {
  fields?: unknown;
  id: string;
  order?: number;
  pageType?: string;
  title?: string;
};

type SnapshotEvent = {
  color?: string | null;
  image?: string | null;
  name?: string | null;
  sections?: SnapshotSection[];
  status?: string | null;
  theme?: string | null;
};

type FieldRecord = {
  field: FormField;
  index: number;
  sectionId: string;
  sectionTitle: string;
};

type LogChange = {
  detail: string;
  field?: FormField;
  id: string;
  kind: "added" | "deleted" | "updated" | "moved" | "meta" | "system";
  title: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function parseArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getSnapshot(value: unknown): SnapshotEvent | null {
  const object = parseObject(value);
  if (!object) return null;
  return {
    color: typeof object.color === "string" ? object.color : null,
    image: typeof object.image === "string" ? object.image : null,
    name: typeof object.name === "string" ? object.name : null,
    sections: parseArray(object.sections).filter(
      (section): section is SnapshotSection =>
        typeof section === "object" &&
        section !== null &&
        typeof (section as SnapshotSection).id === "string",
    ),
    status: typeof object.status === "string" ? object.status : null,
    theme: typeof object.theme === "string" ? object.theme : null,
  };
}

function getFieldLabel(field?: FormField) {
  if (!field) return "Untitled question";
  return stripHtmlToText(field.label || "") || "Untitled question";
}

function getFieldTypeLabel(field: FormField) {
  return getFieldPlugin(field.type)?.meta.label ?? field.type.replaceAll("_", " ");
}

function getSectionTitle(section: SnapshotSection, fallback: number) {
  return section.title?.trim() || `Page ${fallback + 1}`;
}

function flattenFields(snapshot: SnapshotEvent | null) {
  const records = new Map<string, FieldRecord>();

  snapshot?.sections
    ?.slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((section, sectionIndex) => {
      const sectionTitle = getSectionTitle(section, sectionIndex);
      parseArray(section.fields).forEach((rawField, fieldIndex) => {
        const field = parseObject(rawField) as FormField | null;
        if (!field?.id || field.type === "next_button") return;
        records.set(field.id, {
          field,
          index: fieldIndex,
          sectionId: section.id,
          sectionTitle,
        });
      });
    });

  return records;
}

function normalizeValue(value: unknown) {
  if (typeof value === "string") return stripHtmlToText(value).trim();
  return JSON.stringify(value ?? null);
}

function getChangedFieldKeys(before: FormField, after: FormField) {
  return FIELD_CHANGE_KEYS.filter(
    (key) => normalizeValue(before[key]) !== normalizeValue(after[key]),
  );
}

function formatChangedKeys(keys: Array<keyof FormField>) {
  if (keys.length === 0) return "settings";
  return keys
    .slice(0, 3)
    .map((key) => String(key).replace(/([A-Z])/g, " $1").toLowerCase())
    .join(", ");
}

function buildLogChanges(log: FormAuditLog): LogChange[] {
  const before = getSnapshot(log.beforeSnapshot);
  const after = getSnapshot(log.afterSnapshot);
  const changes: LogChange[] = [];

  if (log.action === "form.delete") {
    changes.push({
      detail: "The form and its respondents were moved to Temporary Delete.",
      id: `${log.id}-delete`,
      kind: "deleted",
      title: "Form soft deleted",
    });
  }

  if (log.action === "form.rollback") {
    return [{
      detail: "The form was restored from a previous audit snapshot.",
      id: `${log.id}-rollback`,
      kind: "system",
      title: "Rollback completed",
    }];
  }

  for (const key of Object.keys(META_LABELS)) {
    const beforeValue = before?.[key as keyof SnapshotEvent] ?? null;
    const afterValue = after?.[key as keyof SnapshotEvent] ?? null;
    if (normalizeValue(beforeValue) === normalizeValue(afterValue)) continue;

    changes.push({
      detail:
        key === "image"
          ? "Cover image changed."
          : `${normalizeValue(beforeValue) || "empty"} -> ${
              normalizeValue(afterValue) || "empty"
            }`,
      id: `${log.id}-meta-${key}`,
      kind: "meta",
      title: `${META_LABELS[key]} updated`,
    });
  }

  const beforeFields = flattenFields(before);
  const afterFields = flattenFields(after);

  for (const [fieldId, afterRecord] of afterFields) {
    const beforeRecord = beforeFields.get(fieldId);
    if (!beforeRecord) {
      changes.push({
        detail: `${getFieldTypeLabel(afterRecord.field)} on ${afterRecord.sectionTitle}`,
        field: afterRecord.field,
        id: `${log.id}-added-${fieldId}`,
        kind: "added",
        title: `Added "${getFieldLabel(afterRecord.field)}"`,
      });
      continue;
    }

    const changedKeys = getChangedFieldKeys(beforeRecord.field, afterRecord.field);
    const moved =
      beforeRecord.sectionId !== afterRecord.sectionId ||
      beforeRecord.index !== afterRecord.index;

    if (changedKeys.length > 0) {
      changes.push({
        detail: `Changed ${formatChangedKeys(changedKeys)}.`,
        field: afterRecord.field,
        id: `${log.id}-updated-${fieldId}`,
        kind: "updated",
        title: `Updated "${getFieldLabel(afterRecord.field)}"`,
      });
    }

    if (moved) {
      changes.push({
        detail:
          beforeRecord.sectionTitle === afterRecord.sectionTitle
            ? `Moved within ${afterRecord.sectionTitle}.`
            : `Moved from ${beforeRecord.sectionTitle} to ${afterRecord.sectionTitle}.`,
        field: afterRecord.field,
        id: `${log.id}-moved-${fieldId}`,
        kind: "moved",
        title: `Moved "${getFieldLabel(afterRecord.field)}"`,
      });
    }
  }

  for (const [fieldId, beforeRecord] of beforeFields) {
    if (afterFields.has(fieldId)) continue;
    changes.push({
      detail: `${getFieldTypeLabel(beforeRecord.field)} from ${beforeRecord.sectionTitle}`,
      field: beforeRecord.field,
      id: `${log.id}-deleted-${fieldId}`,
      kind: "deleted",
      title: `Deleted "${getFieldLabel(beforeRecord.field)}"`,
    });
  }

  if (changes.length === 0) {
    changes.push({
      detail: "No question-level change was detected in this snapshot.",
      id: `${log.id}-system`,
      kind: "system",
      title: ACTION_LABELS[log.action] ?? log.action,
    });
  }

  return changes;
}

function getActionMeta(log: FormAuditLog) {
  if (log.action === "form.delete") {
    return {
      Icon: TrashIcon,
      bg: "bg-red-50",
      border: "border-red-100",
      text: "text-red-600",
    };
  }

  if (log.action === "form.rollback") {
    return {
      Icon: ArrowClockwiseIcon,
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-600",
    };
  }

  if (log.action === "builder.save") {
    return {
      Icon: PencilSimpleIcon,
      bg: "bg-primary-50",
      border: "border-primary-100",
      text: "text-primary-600",
    };
  }

  return {
    Icon: FileTextIcon,
    bg: "bg-gray-50",
    border: "border-gray-100",
    text: "text-gray-600",
  };
}

function getChangeClass(kind: LogChange["kind"]) {
  if (kind === "added") return "bg-emerald-50 text-emerald-700";
  if (kind === "deleted") return "bg-red-50 text-red-700";
  if (kind === "updated") return "bg-blue-50 text-blue-700";
  if (kind === "moved") return "bg-amber-50 text-amber-700";
  if (kind === "meta") return "bg-violet-50 text-violet-700";
  return "bg-gray-100 text-gray-600";
}

function FieldTypeIcon({ field }: { field?: FormField }) {
  const meta = field ? getFieldPlugin(field.type as FieldType)?.meta : null;
  const Icon = meta?.Icon ?? FileTextIcon;

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
        meta?.iconBg ?? "bg-gray-100 text-gray-500"
      }`}
      title={field ? getFieldTypeLabel(field) : "System"}
    >
      <Icon size={15} />
    </span>
  );
}

function LogCard({
  log,
  onRollback,
  rollbackPending,
}: {
  log: FormAuditLog;
  onRollback: (logId: string) => void;
  rollbackPending: boolean;
}) {
  const changes = useMemo(() => buildLogChanges(log), [log]);
  const visibleChanges = changes.slice(0, 6);
  const hiddenCount = Math.max(changes.length - visibleChanges.length, 0);
  const canRollback =
    log.targetType === "event" &&
    log.action !== "form.rollback" &&
    Boolean(log.beforeSnapshot);
  const actionMeta = getActionMeta(log);
  const ActionIcon = actionMeta.Icon;

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${actionMeta.bg} ${actionMeta.border}`}
          >
            <ActionIcon size={18} className={actionMeta.text} weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-gray-950">
                {ACTION_LABELS[log.action] ?? log.action}
              </h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                {changes.length} change{changes.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span>{formatDate(log.createdAt)}</span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <UserCircleIcon size={13} />
                <span className="truncate">{log.actorEmail || "Unknown"}</span>
              </span>
            </div>
          </div>
        </div>

        {canRollback ? (
          <button
            type="button"
            disabled={rollbackPending}
            onClick={() => onRollback(log.id)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <ArrowClockwiseIcon size={13} />
            Rollback
          </button>
        ) : null}
      </div>

      <div className="divide-y divide-gray-100">
        {visibleChanges.map((change) => (
          <div key={change.id} className="flex gap-3 px-4 py-3">
            <FieldTypeIcon field={change.field} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 text-sm font-semibold text-gray-900">
                  {change.title}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getChangeClass(
                    change.kind,
                  )}`}
                >
                  {change.kind}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {change.detail}
              </p>
            </div>
          </div>
        ))}

        {hiddenCount > 0 ? (
          <div className="px-4 py-3 text-xs font-semibold text-gray-400">
            +{hiddenCount} more change{hiddenCount === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function SystemLogsPanel({
  eventId,
}: {
  eventId: string;
  showToast?: ShareToast;
}) {
  const logsQuery = useQueryEventAuditLogs(eventId);
  const rollbackLog = useMutationRollbackEventAuditLog(eventId);
  const createPermissionRequest = useMutationCreatePermissionRequest();
  const logs = logsQuery.data ?? [];
  const [rollbackTarget, setRollbackTarget] = useState<FormAuditLog | null>(null);
  const [statusResult, setStatusResult] = useState<{
    type: StatusType;
    title: string;
    description: string;
  } | null>(null);
  const totalQuestionChanges = useMemo(
    () =>
      logs.reduce(
        (total, log) =>
          total +
          buildLogChanges(log).filter((change) =>
            ["added", "deleted", "updated", "moved"].includes(change.kind),
          ).length,
        0,
      ),
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
        description: `The form has been restored to the version from ${formatDate(
          target.createdAt,
        )}.`,
      });
    } catch (error) {
        const permissionError = getPermissionRequiredError(error);
        if (permissionError) {
          createPermissionRequest.mutate({
            action: permissionError.action,
            reason: "Need to rollback form changes",
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
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-gray-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
          <ClockCounterClockwiseIcon size={14} />
          All changes
        </div>
        <RefreshButton
          ariaLabel="Refresh system logs"
          iconSize={15}
          onRefresh={async () => {
            await logsQuery.refetch();
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">Total logs</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{logs.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">
                Question changes
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-950">
                {totalQuestionChanges}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-gray-400">Last update</p>
              <p className="mt-1 truncate text-sm font-bold text-gray-950">
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
                  Builder saves, deletes, and rollbacks will show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  onRollback={() => setRollbackTarget(log)}
                  rollbackPending={rollbackLog.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={() => {
          void handleRollback();
        }}
        variant="warning"
        title="Rollback Form?"
        description={
          rollbackTarget
            ? `This will restore the form to the version from ${formatDate(
                rollbackTarget.createdAt,
              )}. Current changes may be overwritten.`
            : ""
        }
        confirmText="Rollback"
      />

      <LoadingModal
        isOpen={rollbackLog.isPending}
        title="Rolling back..."
        description="Please wait while we restore this form version."
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
