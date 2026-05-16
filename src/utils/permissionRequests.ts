import type { PermissionAction } from "@/types/api";

export type PermissionRequiredError = {
  action: PermissionAction;
  resourceId: string;
  resourceType: string;
};

export function getPermissionRequiredError(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("response" in error)
  ) {
    return null;
  }

  const response = (error as {
    response?: {
      data?: Partial<PermissionRequiredError> & { code?: string };
      status?: number;
    };
  }).response;

  if (
    response?.status !== 403 ||
    response.data?.code !== "PERMISSION_REQUIRED" ||
    !response.data.action ||
    !response.data.resourceId ||
    !response.data.resourceType
  ) {
    return null;
  }

  return {
    action: response.data.action,
    resourceId: response.data.resourceId,
    resourceType: response.data.resourceType,
  };
}

