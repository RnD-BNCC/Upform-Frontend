import {
  CheckCircleIcon,
  SpinnerGapIcon,
  XCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { EmailBlastStatus, EmailLog } from "@/types/api";

const BLAST_STATUS_META: Record<
  EmailBlastStatus,
  { className: string; label: string }
> = {
  cancelled: {
    className: "bg-gray-100 text-gray-500",
    label: "Cancelled",
  },
  done: {
    className: "bg-emerald-100 text-emerald-700",
    label: "Sent",
  },
  failed: {
    className: "bg-rose-100 text-rose-700",
    label: "Failed",
  },
  partial_failed: {
    className: "bg-amber-100 text-amber-700",
    label: "Partial failed",
  },
  processing: {
    className: "bg-blue-100 text-blue-700",
    label: "Sending",
  },
  queued: {
    className: "bg-slate-100 text-slate-600",
    label: "Queued",
  },
};

const LOG_STATUS_META: Record<
  EmailLog["status"],
  { className: string; icon: Icon; label: string }
> = {
  failed: {
    className: "bg-rose-50 text-rose-700",
    icon: XCircleIcon,
    label: "Failed",
  },
  queued: {
    className: "bg-slate-50 text-slate-600",
    icon: SpinnerGapIcon,
    label: "Queued",
  },
  sent: {
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircleIcon,
    label: "Sent",
  },
};

export function formatEmailActivityDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function getBlastStatusMeta(status: EmailBlastStatus) {
  return BLAST_STATUS_META[status] ?? BLAST_STATUS_META.queued;
}

export function getLogStatusMeta(status: EmailLog["status"]) {
  return LOG_STATUS_META[status] ?? LOG_STATUS_META.queued;
}
