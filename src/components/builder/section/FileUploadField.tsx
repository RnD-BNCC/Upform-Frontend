import { memo } from "react";
import {
  CheckCircleIcon,
  FileIcon,
  FolderOpenIcon,
  SpinnerGapIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import FileTypeMultiSelect from "../layout/fields/FileTypeMultiSelect";
import {
  createFieldFactory,
  createFieldPlugin,
} from "./fieldDefinitionHelpers";
import { FieldPluginLabel, FieldPluginToggleRow } from "./FieldSettingControls";
import type { FormField } from "@/types/form";

type Props = {
  allowedFileTypes?: string[];
  maxFileCount?: number;
  maxFileSizeMb?: number;
  limitFileSize?: boolean;
  showUploadLimits?: boolean;
  onChange: (updates: Partial<FormField>) => void;
};

export type FileUploadListItem = {
  name: string;
  canPreview?: boolean;
  errorMessage?: string;
  previewUrl?: string;
  progress?: number;
  status?: "uploading" | "complete" | "error";
  url?: string;
};

type FileUploadFieldCardProps = {
  accept?: string;
  allowedFileTypes?: string[];
  files?: FileUploadListItem[];
  hideDropzone?: boolean;
  isUploading?: boolean;
  limitFileSize?: boolean;
  maxFileCount?: number;
  maxFileSizeMb?: number;
  multiple?: boolean;
  onFilesSelected?: (files: FileList) => void;
  onRemoveFile?: (index: number) => void;
  showUploadLimits?: boolean;
  uploadError?: string;
};

function getFileSizeLabel(maxFileSizeMb?: number) {
  const sizeMb = maxFileSizeMb ?? 10;
  return sizeMb >= 1024 ? `${sizeMb / 1024} GB` : `${sizeMb} MB`;
}

function getFileExtension(name: string) {
  const segments = name.split(".");
  return segments.length > 1 ? segments.at(-1)?.toLowerCase() ?? "" : "";
}

function isPreviewableItem(file: FileUploadListItem) {
  if (typeof file.canPreview === "boolean") {
    return file.canPreview;
  }

  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
    getFileExtension(file.name),
  );
}

function getPreviewSource(file: FileUploadListItem) {
  return file.previewUrl || file.url || "";
}

function getRemoveButtonClass(status: FileUploadListItem["status"]) {
  if (status === "error") {
    return "flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600";
  }

  return "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/45 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-emerald-950/60";
}

function getUploadLimitsText({
  allowedFileTypes,
  limitFileSize,
  maxFileCount,
  maxFileSizeMb,
}: Pick<
  FileUploadFieldCardProps,
  "allowedFileTypes" | "limitFileSize" | "maxFileCount" | "maxFileSizeMb"
>) {
  const count = maxFileCount ?? 1;
  const parts = [`Max file is ${count} file${count > 1 ? "s" : ""}`];

  if (limitFileSize) {
    parts.push(`${getFileSizeLabel(maxFileSizeMb)} per file`);
  }

  if (allowedFileTypes?.length) {
    parts.push(allowedFileTypes.join(", "));
  }

  return parts.join(" · ");
}

export function FileUploadFieldCard({
  accept,
  allowedFileTypes,
  files = [],
  hideDropzone = false,
  isUploading = false,
  limitFileSize,
  maxFileCount,
  maxFileSizeMb,
  multiple,
  onFilesSelected,
  onRemoveFile,
  showUploadLimits,
  uploadError,
}: FileUploadFieldCardProps) {
  const isInteractive = Boolean(onFilesSelected);
  const limitsText = showUploadLimits
    ? getUploadLimitsText({
        allowedFileTypes,
        limitFileSize,
        maxFileCount,
        maxFileSizeMb,
      })
    : "";
  const dropzoneClassName = `theme-answer-input theme-answer-multiline theme-answer-border theme-answer-text flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center transition-colors ${
    isInteractive && !isUploading
      ? "cursor-pointer hover:border-primary-300 hover:bg-primary-50/40"
      : "pointer-events-none select-none"
  } ${isUploading ? "opacity-60" : ""}`;
  const dropzoneContent = (
    <>
      {isUploading ? (
        <SpinnerGapIcon size={28} className="theme-answer-placeholder animate-spin text-gray-400" />
      ) : (
        <FolderOpenIcon size={28} className="theme-answer-placeholder text-gray-400" />
      )}
      <p className="theme-answer-placeholder text-xs text-gray-400">
        {isUploading ? (
          "Uploading file..."
        ) : (
          <>
            Drag &amp; drop a file or{" "}
            <span className="theme-primary-text text-primary-500 underline">browse</span>
          </>
        )}
      </p>
      {limitsText ? (
        <p className="theme-answer-placeholder text-[10px] text-gray-300">{limitsText}</p>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {files.length > 0 ? (
        <div className="mb-1 space-y-1.5">
          {files.map((file, index) => {
            const status = file.status ?? "complete";
            const progress = Math.min(100, Math.max(0, file.progress ?? (status === "complete" ? 100 : 0)));
            const previewSource = getPreviewSource(file);
            const previewable = Boolean(previewSource) && isPreviewableItem(file);
            const statusText =
              status === "uploading"
                ? `Uploading ${progress}%`
                : status === "error"
                  ? "Upload failed"
                  : "Upload complete";
            const helperText =
              status === "uploading"
                ? "tap to cancel"
                : status === "complete"
                  ? "tap to undo"
                  : file.errorMessage || "remove to retry";

            if (!previewable) {
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={`overflow-hidden rounded-xl border ${
                    status === "complete"
                      ? "border-emerald-200 bg-gradient-to-r from-emerald-600 to-emerald-700"
                      : status === "error"
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-[#5c5656]"
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 px-4 py-3 ${
                      status === "error" ? "text-red-700" : "text-white"
                    }`}
                  >
                    <FileIcon
                      size={18}
                      className={`shrink-0 ${
                        status === "error" ? "text-red-400" : "text-white/80"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{file.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{statusText}</p>
                      <p
                        className={`text-[11px] leading-none ${
                          status === "error" ? "text-red-500" : "text-white/75"
                        }`}
                      >
                        {helperText}
                      </p>
                    </div>
                    {status === "uploading" ? (
                      <SpinnerGapIcon size={18} className="shrink-0 animate-spin text-white/90" />
                    ) : status === "complete" ? (
                      <CheckCircleIcon size={18} weight="fill" className="shrink-0 text-white/90" />
                    ) : null}
                    {onRemoveFile ? (
                      <button
                        type="button"
                        onClick={() => onRemoveFile(index)}
                        className={getRemoveButtonClass(status)}
                      >
                        <XIcon size={12} weight="bold" />
                      </button>
                    ) : null}
                  </div>
                  <div className={`h-1 ${status === "error" ? "bg-red-100" : "bg-black/10"}`}>
                    <div
                      className={`h-full transition-all duration-200 ${
                        status === "complete"
                          ? "bg-white/70"
                          : status === "error"
                            ? "bg-red-400"
                            : "bg-white/80"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`${file.name}-${index}`}
                className={`relative overflow-hidden rounded-xl border ${
                  status === "complete"
                    ? "border-emerald-200 bg-emerald-600"
                    : status === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-zinc-900"
                }`}
              >
                <div className="relative h-52 w-full overflow-hidden bg-black/20">
                  <img
                    src={previewSource}
                    alt={file.name}
                    className={`h-full w-full object-cover ${
                      status === "complete" ? "opacity-90" : "opacity-85"
                    }`}
                  />
                  <div
                    className={`absolute inset-0 ${
                      status === "complete"
                        ? "bg-gradient-to-b from-emerald-700/85 via-emerald-700/25 to-black/50"
                        : status === "error"
                          ? "bg-gradient-to-b from-red-600/85 via-red-500/25 to-black/50"
                          : "bg-gradient-to-b from-black/70 via-black/20 to-black/55"
                    }`}
                  />
                </div>
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 text-white">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{file.name}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{statusText}</p>
                      <p className="text-[11px] leading-none text-white/75">{helperText}</p>
                    </div>
                    {status === "uploading" ? (
                      <SpinnerGapIcon size={18} className="mt-0.5 shrink-0 animate-spin text-white/90" />
                    ) : status === "complete" ? (
                      <CheckCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-white/90" />
                    ) : null}
                    {onRemoveFile ? (
                      <button
                        type="button"
                        onClick={() => onRemoveFile(index)}
                        className={getRemoveButtonClass(status)}
                      >
                        <XIcon size={12} weight="bold" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/15">
                  <div
                    className={`h-full transition-all duration-200 ${
                      status === "complete"
                        ? "bg-white/75"
                        : status === "error"
                          ? "bg-red-300"
                          : "bg-white/80"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {hideDropzone ? null : isInteractive ? (
        <label className={dropzoneClassName}>
          {dropzoneContent}
          <input
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            disabled={isUploading}
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) {
                onFilesSelected?.(event.target.files);
                event.target.value = "";
              }
            }}
          />
        </label>
      ) : (
        <div className={dropzoneClassName}>{dropzoneContent}</div>
      )}

      {uploadError ? (
        <p className="mt-1 text-xs font-medium text-red-500">{uploadError}</p>
      ) : null}
    </div>
  );
}

function FileUploadField({
  allowedFileTypes,
  maxFileCount,
  maxFileSizeMb,
  limitFileSize,
  showUploadLimits,
}: Props) {
  return (
    <FileUploadFieldCard
      allowedFileTypes={allowedFileTypes}
      limitFileSize={limitFileSize}
      maxFileCount={maxFileCount}
      maxFileSizeMb={maxFileSizeMb}
      showUploadLimits={showUploadLimits}
    />
  );
}

const MemoizedFileUploadField = memo(FileUploadField);

export default MemoizedFileUploadField;

export const fileUploadFieldPlugin = createFieldPlugin({
  type: "file_upload",
  meta: {
    Icon: UploadSimpleIcon,
    iconBg: "bg-indigo-100 text-indigo-600",
    label: "File upload",
  },
  settings: {
    caption: true,
    halfWidth: true,
  },
  palettes: [
    {
      placement: "builder",
      category: "File & Media",
      label: "File upload",
      order: 10,
    },
  ],
  createField: createFieldFactory("file_upload", {
    label: "File upload",
    required: false,
  }),
  renderBuilder: ({ field, onChange }) => (
    <MemoizedFileUploadField
      allowedFileTypes={field.allowedFileTypes}
      maxFileCount={field.maxFileCount}
      maxFileSizeMb={field.maxFileSizeMb}
      limitFileSize={field.limitFileSize}
      showUploadLimits={field.showUploadLimits}
      onChange={onChange}
    />
  ),
  renderSettingsSections: ({ field, onChange }) => ({
    validation: (
      <>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldPluginLabel>Min files</FieldPluginLabel>
            <input
              type="number"
              value={field.minFileCount ?? ""}
              onChange={(event) =>
                onChange({
                  minFileCount: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
              min={0}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
            />
          </div>
          <div>
            <FieldPluginLabel>Max files</FieldPluginLabel>
            <input
              type="number"
              value={field.maxFileCount ?? ""}
              onChange={(event) =>
                onChange({
                  maxFileCount: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
              min={1}
              placeholder="5"
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
            />
          </div>
        </div>
        <div>
          <FieldPluginLabel tooltip="Shown when file count doesn't meet requirements">
            Error message
          </FieldPluginLabel>
          <input
            type="text"
            value={field.validationErrorMessage ?? ""}
            onChange={(event) =>
              onChange({
                validationErrorMessage: event.target.value || undefined,
              })
            }
            placeholder="Please upload the required files."
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
        <div>
          <FieldPluginLabel tooltip="Overrides the default 'This question is required' message">
            Custom required message
          </FieldPluginLabel>
          <input
            type="text"
            value={field.validationMessage ?? ""}
            onChange={(event) =>
              onChange({ validationMessage: event.target.value || undefined })
            }
            placeholder="This question is required."
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
          />
        </div>
      </>
    ),
    fileSize: (
      <>
        <div>
          <FieldPluginLabel>Max file size (MB)</FieldPluginLabel>
          <input
            type="number"
            min={1}
            max={100}
            disabled={!field.limitFileSize}
            value={field.maxFileSizeMb ?? 10}
            onChange={(event) => {
              const value = Math.min(
                100,
                Math.max(1, Number(event.target.value) || 1),
              );
              onChange({ maxFileSizeMb: value });
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <FieldPluginToggleRow
          label="Limit file size"
          checked={field.limitFileSize ?? false}
          onChange={(value) => onChange({ limitFileSize: value })}
        />
        <FieldPluginToggleRow
          label="Show upload limits"
          checked={field.showUploadLimits ?? false}
          onChange={(value) => onChange({ showUploadLimits: value })}
        />
      </>
    ),
    advanced: (
      <div>
        <FieldPluginLabel>Limit accepted file types</FieldPluginLabel>
        <FileTypeMultiSelect
          selected={field.allowedFileTypes ?? []}
          onChange={(types) =>
            onChange({
              allowedFileTypes: types.length ? types : undefined,
            })
          }
        />
      </div>
    ),
  }),
});
