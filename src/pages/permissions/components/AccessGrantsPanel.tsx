import { useMemo, useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import {
  useMutationCreatePermissionGrant,
  useMutationReactivatePermissionGrant,
  useMutationRevokePermissionGrant,
  useQueryPermissionGrants,
} from "@/api/permission-requests";
import ConditionSelect, {
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";
import { Toggle } from "@/components/ui";
import { Pagination } from "@/components/utils";
import { Spinner } from "@/components/ui";
import type { PermissionAction, PermissionRequest } from "@/types/api";
import type {
  AccessGrantGroup,
  AccessGrantsPanelProps,
} from "@/types/permissions";
import {
  ACTION_LABELS,
  formatDate,
  formatResourceStatus,
} from "@/pages/permissions/permissionUtils";

const FORM_ACTIONS: PermissionAction[] = [
  "forms.edit",
  "forms.delete",
  "forms.rollback",
  "responses.view",
  "responses.edit",
  "responses.delete",
];

const POLL_ACTIONS: PermissionAction[] = [
  "polls.edit",
  "polls.delete",
  "polls.rollback",
];

const RESOURCE_TYPE_OPTIONS: ConditionSelectOption[] = [
  { value: "all", label: "All resources" },
  { value: "event", label: "Form" },
  { value: "poll", label: "Poll" },
];

const GRANT_RESOURCE_TYPE_OPTIONS: ConditionSelectOption[] = [
  { value: "event", label: "Form" },
  { value: "poll", label: "Poll" },
];

const STATUS_OPTIONS: ConditionSelectOption[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Active" },
  { value: "rejected", label: "Off" },
];

const PAGE_SIZE_OPTIONS: ConditionSelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

function getActionsForResource(resourceType: string) {
  return resourceType === "poll" ? POLL_ACTIONS : FORM_ACTIONS;
}

function getActionOptions(resourceType: string): ConditionSelectOption[] {
  return getActionsForResource(resourceType).map((action) => ({
    value: action,
    label: ACTION_LABELS[action] ?? action,
  }));
}

function groupAccessGrants(grants: PermissionRequest[]): AccessGrantGroup[] {
  const groups = new Map<string, AccessGrantGroup>();

  grants.forEach((grant) => {
    const groupKey = [
      grant.requesterEmail,
      grant.resourceType,
      grant.resourceId,
    ].join("::");
    const group = groups.get(groupKey);

    if (group) {
      group.grants.push(grant);
      return;
    }

    groups.set(groupKey, {
      id: groupKey,
      grants: [grant],
      requesterEmail: grant.requesterEmail,
      resourceId: grant.resourceId,
      resourceKind: grant.resourceKind,
      resourceName: grant.resourceName,
      resourceStatus: grant.resourceStatus,
      resourceType: grant.resourceType,
    });
  });

  return Array.from(groups.values());
}

function findGrantByAction(group: AccessGrantGroup, action: PermissionAction) {
  return group.grants.find((grant) => grant.action === action);
}

function getLatestUpdatedAt(group: AccessGrantGroup) {
  return group.grants.reduce<string | null>((latest, grant) => {
    if (!latest) return grant.updatedAt;
    return new Date(grant.updatedAt).getTime() > new Date(latest).getTime()
      ? grant.updatedAt
      : latest;
  }, null);
}

export default function AccessGrantsPanel({
  onError,
  onSuccess,
}: AccessGrantsPanelProps) {
  const [resourceType, setResourceType] = useState<"all" | "event" | "poll">(
    "event",
  );
  const [resourceId, setResourceId] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [status, setStatus] = useState<"approved" | "all" | "rejected">("all");
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [email, setEmail] = useState("");
  const [grantResourceId, setGrantResourceId] = useState("");
  const [grantResourceType, setGrantResourceType] = useState<"event" | "poll">(
    "event",
  );
  const [action, setAction] = useState<PermissionAction>("forms.edit");
  const [reason, setReason] = useState("");

  const grantsQuery = useQueryPermissionGrants({
    page,
    take,
    requesterEmail: requesterEmail.trim().toLowerCase() || undefined,
    resourceId: resourceId.trim() || undefined,
    resourceType: resourceType === "all" ? undefined : resourceType,
    status: status === "all" ? undefined : status,
  });
  const createGrant = useMutationCreatePermissionGrant();
  const reactivateGrant = useMutationReactivatePermissionGrant();
  const revokeGrant = useMutationRevokePermissionGrant();
  const meta = grantsQuery.data?.meta;
  const grants = useMemo(
    () => grantsQuery.data?.data ?? [],
    [grantsQuery.data?.data],
  );
  const grantGroups = useMemo(() => groupAccessGrants(grants), [grants]);
  const isActionLoading =
    createGrant.isPending || reactivateGrant.isPending || revokeGrant.isPending;

  const resetPage = () => setPage(1);

  const handleGrantResourceTypeChange = (nextType: "event" | "poll") => {
    setGrantResourceType(nextType);
    setAction(nextType === "poll" ? "polls.edit" : "forms.edit");
  };

  const handleCreateGrant = async () => {
    const requesterEmail = email.trim().toLowerCase();
    const targetResourceId = grantResourceId.trim();

    if (!requesterEmail || !targetResourceId) {
      onError(
        "Access not added",
        "User email and target resource ID are required. Whitelist only decides who may approve access; the grant still needs a target user and form or poll ID.",
      );
      return;
    }

    try {
      await createGrant.mutateAsync({
        action,
        reason: reason.trim() || "Granted manually by admin",
        requesterEmail,
        resourceId: targetResourceId,
        resourceType: grantResourceType,
      });
      setEmail("");
      setGrantResourceId("");
      setReason("");
      onSuccess(
        "Access Added",
        `${requesterEmail} can now ${ACTION_LABELS[action].toLowerCase()}.`,
      );
    } catch (error) {
      console.error("[handleCreateGrant]", error);
      onError("Access not added", "Something went wrong while adding access.");
    }
  };

  const handleToggleGrant = async (
    group: AccessGrantGroup,
    targetAction: PermissionAction,
    checked: boolean,
  ) => {
    const grant = findGrantByAction(group, targetAction);

    try {
      if (checked) {
        if (grant) {
          await reactivateGrant.mutateAsync(grant.id);
        } else {
          await createGrant.mutateAsync({
            action: targetAction,
            reason: "Granted manually by admin",
            requesterEmail: group.requesterEmail,
            resourceId: group.resourceId,
            resourceType: group.resourceType,
          });
        }
        onSuccess(
          "Access Activated",
          `${group.requesterEmail}'s ${ACTION_LABELS[
            targetAction
          ].toLowerCase()} access is active.`,
        );
        return;
      }

      if (!grant) return;
      await revokeGrant.mutateAsync(grant.id);
      onSuccess(
        "Access Turned Off",
        `${group.requesterEmail}'s ${ACTION_LABELS[
          targetAction
        ].toLowerCase()} access is off.`,
      );
    } catch (error) {
      console.error("[handleToggleGrant]", error);
      onError("Access update failed", "Something went wrong while updating access.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr_140px_130px]">
          <label className="text-xs font-semibold text-gray-500">
            Resource
            <ConditionSelect
              value={resourceType}
              placeholder="Resource"
              options={RESOURCE_TYPE_OPTIONS}
              onChange={(value) => {
                setResourceType(value as "all" | "event" | "poll");
                resetPage();
              }}
              triggerClassName="mt-1 h-9 rounded-md border-gray-200"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Resource ID
            <input
              value={resourceId}
              onChange={(event) => {
                setResourceId(event.target.value);
                resetPage();
              }}
              placeholder="Paste form or poll ID"
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Email
            <input
              value={requesterEmail}
              onChange={(event) => {
                setRequesterEmail(event.target.value);
                resetPage();
              }}
              placeholder="Filter user email"
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Status
            <ConditionSelect
              value={status}
              placeholder="Status"
              options={STATUS_OPTIONS}
              onChange={(value) => {
                setStatus(value as "approved" | "all" | "rejected");
                resetPage();
              }}
              triggerClassName="mt-1 h-9 rounded-md border-gray-200"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Size
            <ConditionSelect
              value={String(take)}
              placeholder="Size"
              options={PAGE_SIZE_OPTIONS}
              onChange={(value) => {
                setTake(Number(value));
                resetPage();
              }}
              triggerClassName="mt-1 h-9 rounded-md border-gray-200"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-[1fr_1fr_140px_180px_1fr_auto]">
          <label className="text-xs font-semibold text-gray-500">
            User Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@upform.id"
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Target Resource ID
            <input
              value={grantResourceId}
              onChange={(event) => setGrantResourceId(event.target.value)}
              placeholder="Form or poll ID"
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Resource
            <ConditionSelect
              value={grantResourceType}
              placeholder="Resource"
              options={GRANT_RESOURCE_TYPE_OPTIONS}
              onChange={(value) =>
                handleGrantResourceTypeChange(value as "event" | "poll")
              }
              triggerClassName="mt-1 h-9 rounded-md border-gray-200"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Access
            <ConditionSelect
              value={action}
              placeholder="Access"
              options={getActionOptions(grantResourceType)}
              onChange={(value) => setAction(value as PermissionAction)}
              triggerClassName="mt-1 h-9 rounded-md border-gray-200"
            />
          </label>
          <label className="text-xs font-semibold text-gray-500">
            Reason
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional"
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={handleCreateGrant}
            className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon size={15} weight="bold" />
            Add
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Access by user</p>
            <p className="text-xs text-gray-400">
              {meta
                ? `${meta.total} access records · page ${meta.page} of ${meta.totalPages}`
                : "Manage access per user and resource"}
            </p>
          </div>
        </div>

        {grantsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-gray-400">
            <Spinner size={28} className="text-primary-500" />
            <p className="text-sm">Loading access list...</p>
          </div>
        ) : grantGroups.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            No access grants found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {grantGroups.map((group) => {
              const actions = getActionsForResource(group.resourceType);
              return (
                <section key={group.id} className="px-4 py-4">
                  <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-950">
                        {group.requesterEmail}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {group.resourceName || "Unknown target"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-gray-400">
                        <span>{group.resourceKind || group.resourceType}</span>
                        {group.resourceStatus ? (
                          <>
                            <span>-</span>
                            <span>
                              {formatResourceStatus(group.resourceStatus)}
                            </span>
                          </>
                        ) : null}
                        <span>-</span>
                        <span className="max-w-[180px] truncate">
                          {group.resourceId}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">
                        Updated {formatDate(getLatestUpdatedAt(group))}
                      </p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {actions.map((item) => {
                        const grant = findGrantByAction(group, item);
                        const isActive = grant?.status === "approved";
                        const isOff = grant?.status === "rejected";

                        return (
                          <div
                            key={`${group.id}-${item}`}
                            className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                              isActive
                                ? "border-emerald-100 bg-emerald-50/60"
                                : isOff
                                  ? "border-gray-200 bg-gray-50"
                                  : "border-gray-100 bg-white"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-gray-800">
                                {ACTION_LABELS[item] ?? item}
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                                {isActive ? "Active" : isOff ? "Off" : "Not granted"}
                              </p>
                            </div>
                            <Toggle
                              checked={isActive}
                              onChange={(checked) =>
                                handleToggleGrant(group, item, checked)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {meta ? (
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
