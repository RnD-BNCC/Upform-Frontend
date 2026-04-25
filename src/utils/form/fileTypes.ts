export type FileTypeOption = {
  label: string;
  value: string;
};

export const FILE_TYPE_OPTIONS: FileTypeOption[] = [
  { label: "JPEG", value: "JPEG" },
  { label: "PNG", value: "PNG" },
  { label: "GIF", value: "GIF" },
  { label: "SVG", value: "SVG" },
  { label: "WebP", value: "WebP" },
  { label: "BMP", value: "BMP" },
  { label: "PDF", value: "PDF" },
  { label: "Word document (DOCX)", value: "DOCX" },
  { label: "Word document (DOC)", value: "DOC" },
  { label: "Excel spreadsheet (XLSX)", value: "XLSX" },
  { label: "Excel spreadsheet (XLS)", value: "XLS" },
  { label: "PowerPoint (PPTX)", value: "PPTX" },
  { label: "CSV", value: "CSV" },
  { label: "Text file (TXT)", value: "TXT" },
  { label: "Video (MP4)", value: "MP4" },
  { label: "Video (MOV)", value: "MOV" },
  { label: "Audio (MP3)", value: "MP3" },
  { label: "Audio (WAV)", value: "WAV" },
  { label: "ZIP archive", value: "ZIP" },
];

export const FILE_TYPE_MIME_MAP: Record<string, string[]> = {
  JPEG: ["image/jpeg"],
  PNG: ["image/png"],
  GIF: ["image/gif"],
  SVG: ["image/svg+xml"],
  WebP: ["image/webp"],
  BMP: ["image/bmp"],
  PDF: ["application/pdf"],
  DOCX: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  DOC: ["application/msword"],
  XLSX: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  XLS: ["application/vnd.ms-excel"],
  PPTX: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  CSV: ["text/csv", "application/csv", "text/comma-separated-values"],
  TXT: ["text/plain"],
  MP4: ["video/mp4"],
  MOV: ["video/quicktime"],
  MP3: ["audio/mpeg", "audio/mp3"],
  WAV: ["audio/wav", "audio/x-wav"],
  ZIP: [
    "application/zip",
    "application/x-zip-compressed",
    "multipart/x-zip",
  ],
  Document: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/rtf",
  ],
  Spreadsheet: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  Presentation: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  Drawing: ["image/svg+xml", "application/x-drawio"],
  Image: ["image/"],
  Video: ["video/"],
  Audio: ["audio/"],
};

function getFileTypeMimeList(type: string) {
  return FILE_TYPE_MIME_MAP[type] ?? [];
}

export function getAcceptedFileMimeList(allowedTypes?: string[]) {
  if (!allowedTypes || allowedTypes.length === 0) return undefined;

  const accepted = Array.from(
    new Set(
      allowedTypes.flatMap((type) =>
        getFileTypeMimeList(type).map((mime) =>
          mime.endsWith("/") ? `${mime}*` : mime,
        ),
      ),
    ),
  );

  return accepted.length > 0 ? accepted.join(",") : undefined;
}

export function isAllowedFileType(file: File, allowedTypes?: string[]) {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const mime = file.type.toLowerCase();
  return allowedTypes.some((type) =>
    getFileTypeMimeList(type).some((allowedMime) => {
      const normalizedMime = allowedMime.toLowerCase();
      return normalizedMime.endsWith("/")
        ? mime.startsWith(normalizedMime)
        : mime === normalizedMime;
    }),
  );
}
