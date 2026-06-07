export type GalleryShareVisibility = "private" | "restricted" | "public";
export type GalleryShareRole = "viewer" | "editor";

export type GalleryShareMember = {
  id?: string;
  email: string;
  role: GalleryShareRole;
};

export type GalleryDriveConnection = {
  id: string;
  ownerEmail: string;
  folderId: string;
  folderUrl: string;
  syncEnabled: boolean;
};

export type GalleryShare = {
  id: string;
  eventId: string;
  visibility: GalleryShareVisibility;
  publicRole: GalleryShareRole;
  token: string;
  shareUrl: string;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  driveOwnerEmail: string | null;
  driveSyncEnabled: boolean;
  driveConnections: GalleryDriveConnection[];
  members: GalleryShareMember[];
};

export type GalleryShareSummary = {
  visibility: GalleryShareVisibility;
  publicRole: GalleryShareRole;
  token: string;
  shareUrl: string;
  memberCount: number;
  driveSyncEnabled: boolean;
  driveFolderUrl: string | null;
  driveOwnerEmail: string | null;
  driveConnections: GalleryDriveConnection[];
};

export type GalleryFileEntry = {
  fieldId: string;
  fieldLabel: string;
  fieldName: string;
  url: string;
  filename: string;
};

export type GalleryResponse = {
  id: string;
  submittedAt: string;
  respondentLabel: string;
  files: GalleryFileEntry[];
};

export type GalleryEvent = {
  id: string;
  name: string;
  status: string;
  fileCount: number;
  share: GalleryShareSummary | null;
  responses: GalleryResponse[];
};

export type GalleryMeta = {
  page: number;
  take: number;
  total: number;
  totalPages: number;
};

export type GalleryFilesData = {
  totalFiles: number;
  events: GalleryEvent[];
  meta: GalleryMeta;
};

export type GalleryMediaItem = {
  key: string;
  url: string;
  filename: string;
  size: number;
  lastModified: string;
};

export type GalleryMediaData = {
  items: GalleryMediaItem[];
  meta: GalleryMeta;
};

export type GallerySharedFilesData = {
  role: GalleryShareRole;
  event: GalleryEvent | null;
};

export type UpdateGallerySharePayload = {
  visibility: GalleryShareVisibility;
  publicRole: GalleryShareRole;
  driveSyncEnabled?: boolean;
  driveFolderId?: string;
  driveFolderUrl?: string;
  members: Array<{
    email: string;
    role: GalleryShareRole;
  }>;
};
