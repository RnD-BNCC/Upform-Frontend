import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import {
  ACTION_LABELS,
  formatDate,
  formatResourceStatus,
  getStatusBadgeClass,
  getStatusIcon,
} from "@/pages/permissions/permissionUtils";
import type { PermissionRequestsTableProps } from "@/types/permissions";

export default function PermissionRequestsTable({
  isApprover,
  isLoading,
  onApprove,
  onReject,
  requests,
}: PermissionRequestsTableProps) {
  return (
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
          {isLoading ? (
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
              <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
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
                    <span className="max-w-[180px] truncate">{request.resourceId}</span>
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
                        onClick={() => onApprove(request)}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckIcon size={13} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(request)}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        <XIcon size={13} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="block text-right text-xs text-gray-300">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
