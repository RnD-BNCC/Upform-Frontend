import type {
  GalleryEvent,
  GalleryFileEntry,
  GalleryMediaItem,
  GalleryResponse,
} from "@/api/gallery";
import type { FolderView } from "@/components/utils";

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

export function isGalleryImageFile(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(extension);
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
