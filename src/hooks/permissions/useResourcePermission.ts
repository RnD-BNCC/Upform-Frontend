import { useCallback, useMemo, useRef, useState } from "react";
import {
  useMutationCreatePermissionRequest,
  useQueryPermissionAccess,
} from "@/api/permission-requests";
import type { PermissionAction } from "@/types/api";
import { getPermissionRequiredError } from "@/utils/permissionRequests";

type UseResourcePermissionParams = {
  action: PermissionAction;
  enabled?: boolean;
  reason: string;
  resourceId: string;
  resourceType?: string;
};

function buildPermissionKey(
  action: PermissionAction,
  resourceType: string,
  resourceId: string,
) {
  return `${action}:${resourceType}:${resourceId}`;
}

export function useResourcePermission({
  action,
  enabled = true,
  reason,
  resourceId,
  resourceType = "event",
}: UseResourcePermissionParams) {
  const canCheckAccess = enabled && !!resourceId;
  const accessQuery = useQueryPermissionAccess(
    { action, resourceId, resourceType },
    canCheckAccess,
  );
  const createPermissionRequest = useMutationCreatePermissionRequest();
  const pendingKeysRef = useRef(new Set<string>());
  const [requestedKeys, setRequestedKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const permissionKey = useMemo(
    () => (resourceId ? buildPermissionKey(action, resourceType, resourceId) : ""),
    [action, resourceId, resourceType],
  );

  const markRequested = useCallback((key: string) => {
    pendingKeysRef.current.add(key);
    setRequestedKeys((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  const clearRequested = useCallback((key: string) => {
    pendingKeysRef.current.delete(key);
    setRequestedKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!permissionKey || accessQuery.data?.allowed) {
      return true;
    }

    if (accessQuery.data?.pending && pendingKeysRef.current.has(permissionKey)) {
      return true;
    }

    if (accessQuery.isSuccess && !accessQuery.data?.pending) {
      pendingKeysRef.current.delete(permissionKey);
    }

    markRequested(permissionKey);

    try {
      await createPermissionRequest.mutateAsync({
        action,
        reason,
        resourceId,
        resourceType,
      });
      await accessQuery.refetch();
      return true;
    } catch (error) {
      clearRequested(permissionKey);
      console.error("[requestPermission]:", error);
      return false;
    }
  }, [
    accessQuery,
    action,
    clearRequested,
    createPermissionRequest,
    markRequested,
    permissionKey,
    reason,
    resourceId,
    resourceType,
  ]);

  const requestPermissionFromError = useCallback(
    async (error: unknown, fallbackReason = reason) => {
      const permissionError = getPermissionRequiredError(error);
      if (!permissionError) return false;

      const key = buildPermissionKey(
        permissionError.action,
        permissionError.resourceType,
        permissionError.resourceId,
      );

      if (pendingKeysRef.current.has(key)) {
        return true;
      }

      markRequested(key);

      try {
        await createPermissionRequest.mutateAsync({
          action: permissionError.action,
          reason: fallbackReason,
          resourceId: permissionError.resourceId,
          resourceType: permissionError.resourceType,
        });
        await accessQuery.refetch();
        return true;
      } catch (requestError) {
        clearRequested(key);
        console.error("[requestPermissionFromError]:", requestError);
        return false;
      }
    },
    [
      accessQuery,
      clearRequested,
      createPermissionRequest,
      markRequested,
      reason,
    ],
  );

  const isAllowed = !canCheckAccess || accessQuery.data?.allowed === true;
  const isPending = accessQuery.data?.pending === true;
  const isResolvedWithoutPending =
    accessQuery.isSuccess && accessQuery.data?.pending !== true;
  const isRequested =
    isPending ||
    (!!permissionKey &&
      !isResolvedWithoutPending &&
      requestedKeys.has(permissionKey));
  const isRequired =
    canCheckAccess &&
    (accessQuery.isError ||
      (accessQuery.isSuccess && accessQuery.data?.allowed !== true));
  const isChecking = canCheckAccess && accessQuery.isLoading;

  return {
    accessQuery,
    isAllowed,
    isChecking,
    isPending,
    isRequested,
    isRequesting: createPermissionRequest.isPending,
    isRequired,
    requestPermission,
    requestPermissionFromError,
  };
}
