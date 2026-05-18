import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckIcon,
  ClockIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  useMutationApprovePermissionRequest,
  useMutationRejectPermissionRequest,
  useQueryPermissionRequests,
} from "@/api/permission-requests";
import { Navbar } from "@/components/layout";
import {
  ConfirmModal,
  LoadingModal,
  StatusModal,
  type StatusType,
} from "@/components/modal";
import { RefreshButton, Spinner } from "@/components/ui";
import type { PermissionRequest } from "@/types/api";

const ACTION_LABELS: Record<string, string> = {
  "forms.edit": "Edit form",
  "forms.delete": "Delete form",
  "forms.rollback": "Rollback form",
  "responses.delete": "Delete respondent",
  "responses.edit": "Edit respondent",
  "responses.view": "View respondent",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getHttpStatus(error: unknown) {
  return (error as { response?: { status?: number } })?.response?.status;
}

function formatResourceStatus(status?: string | null) {
  if (!status) return null;
  return status
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

function getStatusBadgeClass(status: PermissionRequest["status"]) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
  }

  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function getStatusIcon(status: PermissionRequest["status"]) {
  if (status === "approved") return <CheckIcon size={12} weight="bold" />;
  if (status === "rejected") return <XIcon size={12} weight="bold" />;
  return <ClockIcon size={12} weight="bold" />;
}

export default function PermissionsPage() {
  const navigate = useNavigate();
  const requestsQuery = useQueryPermissionRequests();
  const approveRequest = useMutationApprovePermissionRequest();
  const rejectRequest = useMutationRejectPermissionRequest();
  const requests = useMemo(() => {
    const data = requestsQuery.data?.data ?? [];
    return [...data].sort((a, b) => {
      const rankA = a.status === "pending" ? 0 : 1;
      const rankB = b.status === "pending" ? 0 : 1;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requestsQuery.data?.data]);
  const isApprover = requestsQuery.data?.approver ?? false;
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    request: PermissionRequest;
  } | null>(null);
  const [statusResult, setStatusResult] = useState<{
    type: StatusType;
    title: string;
    description: string;
  } | null>(null);
  const isActionLoading = approveRequest.isPending || rejectRequest.isPending;

  useEffect(() => {
    const forbidden = getHttpStatus(requestsQuery.error) === 403;
    if (forbidden || (requestsQuery.isSuccess && !isApprover)) {
      navigate("/", { replace: true });
    }
  }, [isApprover, navigate, requestsQuery.error, requestsQuery.isSuccess]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    const action = confirmAction;
    setConfirmAction(null);

    try {
      if (action.type === "approve") {
        await approveRequest.mutateAsync(action.request.id);
        const targetName = action.request.resourceName || "this target";
        setStatusResult({
          type: "success",
          title:
            action.request.action === "forms.delete"
              ? "Form Deleted"
              : "Request Approved",
          description:
            action.request.action === "forms.delete"
              ? `"${targetName}" has been moved to Temporary Delete.`
              : `${action.request.requesterEmail} can now ${ACTION_LABELS[
                  action.request.action
                ].toLowerCase()} for "${targetName}".`,
        });
        return;
      }

      await rejectRequest.mutateAsync(action.request.id);
      setStatusResult({
        type: "success",
        title: "Request Rejected",
        description: `${action.request.requesterEmail}'s request has been rejected.`,
      });
    } catch (error) {
      console.error("[handleConfirmPermissionAction]", error);
      setStatusResult({
        type: "error",
        title: "Action Failed",
        description: "Something went wrong while updating the request.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-950">
              Permission requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review activist requests for sensitive actions.
            </p>
          </div>
          <RefreshButton
            ariaLabel="Refresh permission requests"
            iconSize={15}
            onRefresh={async () => {
              await requestsQuery.refetch();
            }}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requestsQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <Spinner size={28} className="text-primary-500" />
                      <p className="text-sm">Loading permission requests...</p>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No permission requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {request.requesterEmail}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ACTION_LABELS[request.action] ?? request.action}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {request.resourceName || "Unknown target"}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-gray-400">
                        <span>{request.resourceKind || request.resourceType}</span>
                        {request.resourceStatus ? (
                          <>
                            <span>-</span>
                            <span>{formatResourceStatus(request.resourceStatus)}</span>
                          </>
                        ) : null}
                        <span>-</span>
                        <span className="max-w-[180px] truncate">
                          {request.resourceId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold capitalize ${getStatusBadgeClass(
                          request.status,
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isApprover && request.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({ type: "approve", request })
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <CheckIcon size={13} />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({ type: "reject", request })
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <XIcon size={13} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-gray-300">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        variant={confirmAction?.type === "reject" ? "danger" : "warning"}
        title={
          confirmAction?.type === "approve"
            ? "Approve Request?"
            : "Reject Request?"
        }
        description={
          confirmAction
            ? `${confirmAction.request.requesterEmail} requested ${ACTION_LABELS[
                confirmAction.request.action
              ].toLowerCase()} for "${
                confirmAction.request.resourceName || "this target"
              }".`
            : ""
        }
        confirmText={confirmAction?.type === "approve" ? "Approve" : "Reject"}
      />

      <LoadingModal isOpen={isActionLoading} />

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
