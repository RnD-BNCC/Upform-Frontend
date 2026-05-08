import type {
  GalleryEvent,
  GalleryFileEntry,
  GalleryMediaItem,
  GalleryResponse,
} from "@/api/gallery";
import type { FolderView } from "@/components/utils";
import { Api } from "@/constants/api";

export type GalleryTab = "files" | "media";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "svg",
  "heic",
]);

function matchesSearch(value: string, lowerSearch: string) {
  return !lowerSearch || value.toLowerCase().includes(lowerSearch);
}

export function formatGalleryFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatGalleryDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileExtension(value: string) {
  const cleanValue = value.split("?")[0].split("#")[0];
  return cleanValue.split(".").pop()?.toLowerCase() ?? "";
}

export function isGalleryImageFile(filename: string, url?: string) {
  const extension = getFileExtension(filename);
  const urlExtension = url ? getFileExtension(url) : "";
  return IMAGE_EXTENSIONS.has(extension) || IMAGE_EXTENSIONS.has(urlExtension);
}

export function getGalleryPreviewUrl(url: string) {
  const baseUrl = import.meta.env.VITE_API_URL;
  const separator = Api.galleryFilePreview.includes("?") ? "&" : "?";
  return `${baseUrl}/api${Api.galleryFilePreview}${separator}url=${encodeURIComponent(url)}`;
}

export function filterGalleryEvents(
  events: GalleryEvent[],
  lowerSearch: string,
) {
  return events.filter((event) => matchesSearch(event.name, lowerSearch));
}

export function findGalleryEvent(
  events: GalleryEvent[],
  view: FolderView,
) {
  return view.level === "root"
    ? undefined
    : events.find((event) => event.id === view.eventId);
}

export function filterGalleryResponses(
  responses: GalleryResponse[],
  lowerSearch: string,
) {
  return responses.filter((response) =>
    matchesSearch(response.respondentLabel, lowerSearch),
  );
}

export function findGalleryResponse(
  responses: GalleryResponse[],
  view: FolderView,
) {
  return view.level === "respondent"
    ? responses.find((response) => response.id === view.responseId)
    : undefined;
}

export function filterGalleryFiles(
  files: GalleryFileEntry[],
  lowerSearch: string,
) {
  return files.filter((file) => matchesSearch(file.filename, lowerSearch));
}

export function filterGalleryMedia(
  mediaItems: GalleryMediaItem[],
  lowerSearch: string,
) {
  return mediaItems.filter((item) => matchesSearch(item.filename, lowerSearch));
}

export function getGallerySearchPlaceholder(
  tab: GalleryTab,
  folderView: FolderView,
) {
  if (tab === "media") return "Search media...";
  if (folderView.level === "root") return "Search events...";
  if (folderView.level === "event") return "Search people...";
  return "Search files...";
}
