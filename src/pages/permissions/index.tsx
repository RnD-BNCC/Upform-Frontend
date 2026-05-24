import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@/components/modal";
import { RefreshButton } from "@/components/ui";
import {
  AccessGrantsPanel,
  PermissionRequestsTable,
} from "@/pages/permissions/components";
import { ACTION_LABELS, getHttpStatus } from "@/pages/permissions/permissionUtils";
import type {
  PermissionConfirmAction,
  PermissionStatusResult,
  PermissionTab,
} from "@/types/permissions";

export default function PermissionsPage() {
  const navigate = useNavigate();
  const requestsQuery = useQueryPermissionRequests();
  const approveRequest = useMutationApprovePermissionRequest();
  const rejectRequest = useMutationRejectPermissionRequest();
  const [activeTab, setActiveTab] = useState<PermissionTab>("requests");
  const [confirmAction, setConfirmAction] =
    useState<PermissionConfirmAction | null>(null);
  const [statusResult, setStatusResult] =
    useState<PermissionStatusResult | null>(null);

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

  const showStatus = (
    type: PermissionStatusResult["type"],
    title: string,
    description: string,
  ) => {
    setStatusResult({ type, title, description });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-950">
                Permission management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review requests and manage active form or poll access.
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

          <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`h-9 rounded-md px-4 text-sm font-bold transition ${
                activeTab === "requests"
                  ? "bg-primary-600 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              Requests
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("access")}
              className={`h-9 rounded-md px-4 text-sm font-bold transition ${
                activeTab === "access"
                  ? "bg-primary-600 text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              Access
            </button>
          </div>

          {activeTab === "requests" ? (
            <PermissionRequestsTable
              isApprover={isApprover}
              isLoading={requestsQuery.isLoading}
              onApprove={(request) => setConfirmAction({ type: "approve", request })}
              onReject={(request) => setConfirmAction({ type: "reject", request })}
              requests={requests}
            />
          ) : (
            <AccessGrantsPanel
              onError={(title, description) =>
                showStatus("error", title, description)
              }
              onSuccess={(title, description) =>
                showStatus("success", title, description)
              }
            />
          )}
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
