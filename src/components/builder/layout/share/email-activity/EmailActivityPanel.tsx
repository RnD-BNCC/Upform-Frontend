import { useMemo, useState } from "react";
import {
  EnvelopeSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import {
  useQueryEmailBlastDetail,
  useQueryEmailBlasts,
} from "@/api/email-blasts";
import type { EmailLog } from "@/types/api";
import { RefreshButton } from "@/components/ui";
import {
  formatEmailActivityDate,
  getBlastStatusMeta,
  getLogStatusMeta,
} from "./emailActivityMeta";

type EmailActivityPanelProps = {
  eventId: string;
};

export default function EmailActivityPanel({ eventId }: EmailActivityPanelProps) {
  const [activeBlastId, setActiveBlastId] = useState<string | null>(null);
  const blastsQuery = useQueryEmailBlasts(1, 8, eventId);
  const blasts = blastsQuery.data?.data ?? [];
  const selectedBlastId =
    blasts.find((blast) => blast.id === activeBlastId)?.id ?? blasts[0]?.id ?? "";
  const detailQuery = useQueryEmailBlastDetail(selectedBlastId);
  const selectedBlast = detailQuery.data;
  const logByRecipient = useMemo(() => {
    const entries =
      selectedBlast?.logs.map((log) => [log.recipient, log] as const) ?? [];
    return new Map<string, EmailLog>(entries);
  }, [selectedBlast]);

  const refreshActivity = () => {
    return Promise.all([
      blastsQuery.refetch(),
      selectedBlastId ? detailQuery.refetch() : Promise.resolve(),
    ]).then(() => undefined);
  };

  return (
    <div className="min-w-0 rounded-sm border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900">Email activity</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Track every blast and recipient delivery status.
          </p>
        </div>
        <RefreshButton
          ariaLabel="Refresh email activity"
          className="h-8 w-8 shrink-0 rounded-sm shadow-none"
          iconSize={15}
          iconWeight="bold"
          onRefresh={refreshActivity}
        />
      </div>

      {blastsQuery.isLoading ? (
        <div className="flex h-56 items-center justify-center text-sm font-semibold text-gray-400">
          <Spinner size={18} className="mr-2" />
          Loading activity...
        </div>
      ) : blasts.length === 0 ? (
        <div className="px-5 py-8">
          <div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <EnvelopeSimpleIcon
              size={26}
              weight="fill"
              className="mx-auto text-gray-300"
            />
            <p className="mt-3 text-sm font-bold text-gray-800">
              No email sent yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Sent email logs will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-[360px] grid-cols-1 divide-y divide-gray-100 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:divide-x lg:divide-y-0">
          <div className="min-w-0">
            <div className="max-h-[420px] overflow-y-auto p-3">
              <div className="space-y-2">
                {blasts.map((blast) => {
                  const meta = getBlastStatusMeta(blast.status);
                  const isActive = blast.id === selectedBlastId;
                  const progress =
                    blast.totalCount > 0
                      ? Math.round(
                          ((blast.sentCount + blast.failedCount) /
                            blast.totalCount) *
                            100,
                        )
                      : 0;

                  return (
                    <button
                      key={blast.id}
                      type="button"
                      onClick={() => setActiveBlastId(blast.id)}
                      className={`w-full rounded-sm border p-3 text-left transition-colors ${
                        isActive
                          ? "border-primary-300 bg-primary-50/70"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {blast.subject || "Untitled email"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatEmailActivityDate(blast.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            blast.failedCount > 0
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-gray-400">
                        <span className="text-emerald-600">
                          {blast.sentCount} sent
                        </span>
                        <span className="text-rose-600">
                          {blast.failedCount} failed
                        </span>
                        <span>{blast.totalCount} total</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            {detailQuery.isLoading && !selectedBlast ? (
              <div className="flex h-full min-h-[260px] items-center justify-center text-sm font-semibold text-gray-400">
                <Spinner size={18} className="mr-2" />
                Loading logs...
              </div>
            ) : selectedBlast ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {selectedBlast.subject || "Untitled email"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatEmailActivityDate(selectedBlast.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        getBlastStatusMeta(selectedBlast.status).className
                      }`}
                    >
                      {getBlastStatusMeta(selectedBlast.status).label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-sm bg-emerald-50 px-3 py-2">
                      <p className="text-lg font-black text-emerald-700">
                        {selectedBlast.sentCount}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600">
                        Sent
                      </p>
                    </div>
                    <div className="rounded-sm bg-rose-50 px-3 py-2">
                      <p className="text-lg font-black text-rose-700">
                        {selectedBlast.failedCount}
                      </p>
                      <p className="text-[11px] font-semibold text-rose-600">
                        Failed
                      </p>
                    </div>
                    <div className="rounded-sm bg-gray-50 px-3 py-2">
                      <p className="text-lg font-black text-gray-800">
                        {selectedBlast.totalCount}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-500">
                        Total
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {selectedBlast.recipients.map((recipient) => {
                    const log = logByRecipient.get(recipient);
                    const status = log?.status ?? "queued";
                    const meta = getLogStatusMeta(status);
                    const Icon = meta.icon;

                    return (
                      <div
                        key={recipient}
                        className="flex min-w-0 items-start gap-3 border-b border-gray-100 px-5 py-3 last:border-b-0"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}
                        >
                          <Icon
                            size={16}
                            weight="fill"
                            className={status === "queued" ? "animate-spin" : ""}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {recipient}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          {log?.error ? (
                            <p className="mt-1 flex items-start gap-1 text-xs text-rose-600">
                              <WarningCircleIcon
                                size={13}
                                weight="fill"
                                className="mt-0.5 shrink-0"
                              />
                              <span className="break-words">{log.error}</span>
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-gray-400">
                              {log?.sentAt
                                ? `Sent ${formatEmailActivityDate(log.sentAt)}`
                                : "Waiting for delivery result"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
