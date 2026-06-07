import { CheckIcon, ClockIcon, XIcon } from "@phosphor-icons/react";
import type { PermissionRequest } from "@/types/api";

export const ACTION_LABELS: Record<string, string> = {
  "forms.edit": "Edit form",
  "forms.delete": "Delete form",
  "forms.rollback": "Rollback form",
  "gallery.delete": "Delete gallery file",
  "gallery.manage": "Manage gallery",
  "gallery.view": "View gallery",
  "polls.delete": "Delete poll",
  "polls.edit": "Edit poll",
  "polls.rollback": "Rollback poll",
  "responses.delete": "Delete respondent",
  "responses.edit": "Edit respondent",
  "responses.view": "View respondent",
};

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getHttpStatus(error: unknown) {
  return (error as { response?: { status?: number } })?.response?.status;
}

export function formatResourceStatus(status?: string | null) {
  if (!status) return null;
  return status
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

export function getStatusBadgeClass(status: PermissionRequest["status"]) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
  }

  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

export function getStatusIcon(status: PermissionRequest["status"]) {
  if (status === "approved") return <CheckIcon size={12} weight="bold" />;
  if (status === "rejected") return <XIcon size={12} weight="bold" />;
  return <ClockIcon size={12} weight="bold" />;
}
