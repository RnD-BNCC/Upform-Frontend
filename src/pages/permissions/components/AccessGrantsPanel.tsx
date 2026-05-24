import { useMemo, useState } from "react";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useQueryEvents } from "@/api/events";
import {
  useMutationCreatePermissionGrant,
  useMutationReactivatePermissionGrant,
  useMutationRevokePermissionGrant,
  useQueryPermissionGrants,
} from "@/api/permission-requests";
import { useQueryPolls } from "@/api/polls";
import ConditionSelect, {
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";
import { BaseModal, Toggle } from "@/components/ui";
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

const DEFAULT_ACTION_BY_RESOURCE = {
  event: "forms.edit",
  poll: "polls.edit",
} as const satisfies Record<"event" | "poll", PermissionAction>;

function getActionsForResource(resourceType: string) {
  return resourceType === "poll" ? POLL_ACTIONS : FORM_ACTIONS;
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
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addTargetId, setAddTargetId] = useState("");
  const [grantResourceType, setGrantResourceType] = useState<"event" | "poll">(
    "event",
  );
  const [selectedActions, setSelectedActions] = useState<Set<PermissionAction>>(
    () => new Set([DEFAULT_ACTION_BY_RESOURCE.event]),
  );
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
  const eventTargetsQuery = useQueryEvents({
    page: 1,
    take: 50,
    deleted: false,
  });
  const pollTargetsQuery = useQueryPolls(1, 50, undefined, false);
  const meta = grantsQuery.data?.meta;
  const grants = useMemo(
    () => grantsQuery.data?.data ?? [],
    [grantsQuery.data?.data],
  );
  const targetOptions = useMemo<ConditionSelectOption[]>(() => {
    if (grantResourceType === "poll") {
      return (pollTargetsQuery.data?.data ?? []).map((poll) => ({
        value: poll.id,
        label: poll.title?.trim() || "Untitled poll",
        subtitle: poll.id,
        searchText: `${poll.title ?? ""} ${poll.id} ${poll.code}`,
      }));
    }

    return (eventTargetsQuery.data?.data ?? []).map((event) => ({
      value: event.id,
      label: event.name?.trim() || "Untitled form",
      subtitle: event.id,
      searchText: `${event.name ?? ""} ${event.id}`,
    }));
  }, [eventTargetsQuery.data?.data, grantResourceType, pollTargetsQuery.data?.data]);
  const grantGroups = useMemo(() => groupAccessGrants(grants), [grants]);
  const isActionLoading =
    createGrant.isPending || reactivateGrant.isPending || revokeGrant.isPending;
  const isTargetLoading =
    grantResourceType === "poll"
      ? pollTargetsQuery.isLoading
      : eventTargetsQuery.isLoading;

  const resetPage = () => setPage(1);

  const handleGrantResourceTypeChange = (nextType: "event" | "poll") => {
    setGrantResourceType(nextType);
    setAddTargetId("");
    setSelectedActions(new Set([DEFAULT_ACTION_BY_RESOURCE[nextType]]));
  };

  const handleCreateGrant = async () => {
    const targetEmail = addEmail.trim().toLowerCase();
    const targetResourceId = addTargetId.trim();

    if (!targetEmail || !targetResourceId) {
      onError(
        "Access not added",
        "Target user email and form or poll title are required.",
      );
      return;
    }

    if (selectedActions.size === 0) {
      onError(
        "Access not added",
        "Choose at least one permission to activate.",
      );
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedActions).map((permissionAction) =>
          createGrant.mutateAsync({
            action: permissionAction,
            reason: reason.trim() || "Granted manually by admin",
            requesterEmail: targetEmail,
            resourceId: targetResourceId,
            resourceType: grantResourceType,
          }),
        ),
      );
      setAddEmail("");
      setAddTargetId("");
      setReason("");
      setSelectedActions(new Set([DEFAULT_ACTION_BY_RESOURCE[grantResourceType]]));
      setAddOpen(false);
      onSuccess(
        "Access Added",
        `${targetEmail} now has ${selectedActions.size} active permission${
          selectedActions.size === 1 ? "" : "s"
        }.`,
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

  const toggleSelectedAction = (permissionAction: PermissionAction) => {
    setSelectedActions((current) => {
      const next = new Set(current);
      if (next.has(permissionAction)) {
        next.delete(permissionAction);
      } else {
        next.add(permissionAction);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr_140px_130px_auto]">
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
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700"
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

      <BaseModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        zIndex="z-[10000]"
        className="w-full max-w-2xl rounded-lg"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-950">Add access</h2>
            <p className="mt-1 text-xs text-gray-400">
              Pick a target user, target form or poll, then activate permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <XIcon size={17} weight="bold" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block text-xs font-semibold text-gray-500">
            Target user email
            <input
              value={addEmail}
              onChange={(event) => setAddEmail(event.target.value)}
              placeholder="target-user@upform.id"
              className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <label className="text-xs font-semibold text-gray-500">
              Resource
              <ConditionSelect
                value={grantResourceType}
                placeholder="Resource"
                options={GRANT_RESOURCE_TYPE_OPTIONS}
                onChange={(value) =>
                  handleGrantResourceTypeChange(value as "event" | "poll")
                }
                triggerClassName="mt-1 h-10 rounded-md border-gray-200"
              />
            </label>

            <label className="text-xs font-semibold text-gray-500">
              Title
              <ConditionSelect
                value={addTargetId}
                placeholder={isTargetLoading ? "Loading targets..." : "Choose title"}
                options={targetOptions}
                searchable
                searchPlaceholder={
                  grantResourceType === "poll"
                    ? "Search poll title..."
                    : "Search form title..."
                }
                emptyLabel={
                  grantResourceType === "poll"
                    ? "No polls found"
                    : "No forms found"
                }
                menuWidth={420}
                onChange={setAddTargetId}
                triggerClassName="mt-1 h-10 rounded-md border-gray-200"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-gray-500">
            Reason
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional"
              className="mt-1 h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-800 outline-none focus:border-primary-400"
            />
          </label>

          <div>
            <p className="text-xs font-semibold text-gray-500">Permissions</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {getActionsForResource(grantResourceType).map((permissionAction) => {
                const checked = selectedActions.has(permissionAction);
                return (
                  <div
                    key={permissionAction}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                      checked
                        ? "border-emerald-100 bg-emerald-50/60"
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-800">
                        {ACTION_LABELS[permissionAction] ?? permissionAction}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-gray-400">
                        {checked ? "Active" : "Off"}
                      </p>
                    </div>
                    <Toggle
                      checked={checked}
                      onChange={() => toggleSelectedAction(permissionAction)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={() => setAddOpen(false)}
            className="h-9 rounded-md border border-gray-200 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isActionLoading}
            onClick={handleCreateGrant}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon size={15} weight="bold" />
            Add access
          </button>
        </div>
      </BaseModal>
    </div>
  );
}
