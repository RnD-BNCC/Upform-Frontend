import type { StatusType } from "@/components/modal";
import type { PermissionRequest } from "@/types/api";

export type PermissionTab = "requests" | "access";

export type PermissionConfirmAction = {
  type: "approve" | "reject";
  request: PermissionRequest;
};

export type PermissionStatusResult = {
  type: StatusType;
  title: string;
  description: string;
};

export type AccessGrantsPanelProps = {
  onError: (title: string, description: string) => void;
  onSuccess: (title: string, description: string) => void;
};

export type AccessGrantGroup = {
  id: string;
  requesterEmail: string;
  resourceId: string;
  resourceKind?: string | null;
  resourceName?: string | null;
  resourceStatus?: string | null;
  resourceType: string;
  grants: PermissionRequest[];
};

export type PermissionRequestsTableProps = {
  isApprover: boolean;
  isLoading: boolean;
  onApprove: (request: PermissionRequest) => void;
  onReject: (request: PermissionRequest) => void;
  requests: PermissionRequest[];
};
