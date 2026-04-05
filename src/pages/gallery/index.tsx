import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, Footer } from "@/components/layout";
import {
  ConfirmModal,
  LoadingModal,
  Pagination,
  StatusModal,
} from "@/components/ui";
import {
  useQueryGalleryFiles,
  useQueryGalleryMedia,
  useMutationDeleteFile,
  type GalleryMediaItem,
} from "@/api/gallery/queries";
import { useMutationUploadImage } from "@/api/upload/queries";
import { useQueryClient } from "@tanstack/react-query";
import type { StatusType } from "@/components/ui/StatusModal";
import {
  MagnifyingGlass,
  SpinnerGap,
  FilePdf,
  FileImage,
  File,
  Trash,
  DownloadSimple,
  Images,
  Folder,
  FolderOpen,
  Link,
  UploadSimple,
  Warning,
  User,
  X,
} from "@phosphor-icons/react";
import { Breadcrumb, type FolderView } from "@/components/gallery/Breadcrumb";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FolderItem({
  icon,
  name,
  meta,
  count,
  countLabel,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  meta?: string;
  count: number;
  countLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-primary-200 transition-all cursor-pointer text-left group w-full"
    >
      <div className="flex items-start justify-between">
        <div className="text-primary-400 group-hover:text-primary-500 transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate leading-snug">
          {name}
        </p>
        {meta && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{meta}</p>
        )}
        <p className="text-[10px] text-gray-400">{countLabel}</p>
      </div>
    </button>
  );
}

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "svg",
  "heic",
]);

function FileCard({
  url,
  filename,
  fieldLabel,
  onDelete,
  onPreview,
}: {
  url: string;
  filename: string;
  fieldLabel: string;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const isImage = IMAGE_EXTS.has(ext);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group/card relative rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div
        className={`aspect-video flex items-center justify-center bg-gray-50 ${isImage && !imgError ? "cursor-zoom-in" : ""}`}
        onClick={isImage && !imgError ? onPreview : undefined}
      >
        {isImage && !imgError ? (
          <img
            src={url}
            alt={filename}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-4">
            {ext === "pdf" ? (
              <FilePdf size={32} className="text-red-300" />
            ) : isImage ? (
              <FileImage size={32} className="text-blue-300" />
            ) : (
              <File size={32} className="text-gray-300" />
            )}
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-gray-800 truncate">
          {filename}
        </p>
        <p className="text-[10px] text-gray-400">{fieldLabel}</p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-blue-600 hover:bg-white transition-colors shadow cursor-pointer"
          title="Download"
        >
          <DownloadSimple size={13} weight="bold" />
        </a>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white transition-colors cursor-pointer shadow"
          title="Delete"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function ImagePreviewModal({
  url,
  filename,
  onClose,
}: {
  url: string;
  filename: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={filename}
          className="max-h-[85vh] w-full object-contain rounded-xl"
        />
        <p className="text-white/60 text-xs text-center mt-2 truncate">
          {filename}
        </p>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={14} weight="bold" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function MediaCard({
  item,
  onDelete,
  onCopy,
  onPreview,
}: {
  item: GalleryMediaItem;
  onDelete: () => void;
  onCopy: () => void;
  onPreview: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`group/card relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-video ${!imgError ? "cursor-zoom-in" : ""}`}
      onClick={!imgError ? onPreview : undefined}
    >
      {imgError ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <Warning size={28} />
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.filename}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all">
        <p className="text-[11px] font-semibold text-white truncate">
          {item.filename}
        </p>
        <p className="text-[10px] text-white/60 truncate">
          {formatSize(item.size)}
        </p>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer shadow"
          title="Copy URL"
        >
          <Link size={13} weight="bold" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white transition-colors cursor-pointer shadow"
          title="Delete"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}

type Tab = "files" | "media";

export default function GalleryPage() {
  const [tab, setTab] = useState<Tab>("files");
  const [search, setSearch] = useState("");
  const [folderView, setFolderView] = useState<FolderView>({ level: "root" });
  const [filesPage, setFilesPage] = useState(1);
  const [mediaPage, setMediaPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    url: string;
    label: string;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const [status, setStatus] = useState<{
    type: StatusType;
    message: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const filesQuery = useQueryGalleryFiles(filesPage, 20);
  const mediaQuery = useQueryGalleryMedia(mediaPage, 21);
  const deleteMutation = useMutationDeleteFile();
  const uploadMutation = useMutationUploadImage();

  const lowerSearch = search.toLowerCase().trim();

  const allEvents = filesQuery.data?.events ?? [];

  const navigate = (view: FolderView) => {
    setFolderView(view);
    setSearch("");
    setFilesPage(1);
  };

  const rootEvents = allEvents.filter(
    (e) => !lowerSearch || e.name.toLowerCase().includes(lowerSearch),
  );

  const currentEvent =
    folderView.level !== "root"
      ? allEvents.find((e) => e.id === folderView.eventId)
      : undefined;

  const eventResponses =
    currentEvent?.responses.filter(
      (r) =>
        !lowerSearch || r.respondentLabel.toLowerCase().includes(lowerSearch),
    ) ?? [];

  const currentResponse =
    folderView.level === "respondent"
      ? currentEvent?.responses.find((r) => r.id === folderView.responseId)
      : undefined;

  const respondentFiles =
    currentResponse?.files.filter(
      (f) => !lowerSearch || f.filename.toLowerCase().includes(lowerSearch),
    ) ?? [];

  const filteredMedia = (mediaQuery.data?.items ?? []).filter(
    (m) => !lowerSearch || m.filename.toLowerCase().includes(lowerSearch),
  );

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    deleteMutation.mutate(target.url, {
      onSuccess: () => setStatus({ type: "success", message: "File deleted." }),
      onError: () =>
        setStatus({ type: "error", message: "Failed to delete file." }),
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gallery-media"] });
        setStatus({ type: "success", message: "Image uploaded." });
      },
      onError: () => {
        setStatus({ type: "error", message: "Upload failed." });
      },
    });
    e.target.value = "";
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("URL copied");
  };

  const totalFiles = filesQuery.data?.totalFiles ?? 0;
  const totalMedia = mediaQuery.data?.items.length ?? 0;

  const searchPlaceholder =
    tab === "media"
      ? "Search media…"
      : folderView.level === "root"
        ? "Search events…"
        : folderView.level === "event"
          ? "Search people…"
          : "Search files…";

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Navbar />

      <div className="bg-primary-800 rounded-b-4xl shadow-[0_12px_40px_-8px_rgba(0,30,70,0.45)] relative">
        <div className="absolute inset-0 overflow-hidden rounded-b-4xl pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 18% 80%, rgba(0,30,70,0.45)] 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(0,18,42,0.65) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 0% 100%, rgba(255,255,255,0.18) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10 pb-6 sm:pb-8">
            <div>
              <p className="text-primary-300 text-sm font-bold mb-1">Storage</p>
              <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-white leading-tight">
                Gallery
              </h1>
              <p className="text-white text-sm mt-1.5">
                Browse, preview, and manage your uploaded files.
              </p>
            </div>
            <div className="flex items-stretch bg-white/10 border border-white/15 rounded-xl backdrop-blur-sm divide-x divide-white/10 shrink-0 w-full sm:w-auto">
              <div className="flex flex-col items-center justify-center flex-1 sm:flex-none sm:px-8 py-4 sm:py-5 gap-1 sm:gap-1.5">
                <span className="text-2xl sm:text-[2.25rem] font-black text-white leading-none tracking-tight tabular-nums">
                  {totalFiles}
                </span>
                <span className="text-[10px] sm:text-[11px] text-white/50 font-semibold tracking-widest uppercase">
                  Form Files
                </span>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 sm:flex-none sm:px-8 py-4 sm:py-5 gap-1 sm:gap-1.5">
                <span className="text-2xl sm:text-[2.25rem] font-black text-white leading-none tracking-tight tabular-nums">
                  {totalMedia}
                </span>
                <span className="text-[10px] sm:text-[11px] text-white/50 font-semibold tracking-widest uppercase">
                  Media
                </span>
              </div>
            </div>
          </div>
          <div className="flex -mx-4 sm:-mx-8 px-4 sm:px-8">
            {(["files", "media"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSearch("");
                  setFolderView({ level: "root" });
                  setFilesPage(1);
                  setMediaPage(1);
                }}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  tab === t
                    ? "border-white text-white"
                    : "border-transparent text-white/50 hover:text-white/80"
                }`}
              >
                {t === "files" ? "Form Files" : "Media"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFilesPage(1);
                setMediaPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
            />
          </div>
          {tab === "media" && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? (
                  <SpinnerGap size={14} className="animate-spin" />
                ) : (
                  <UploadSimple size={14} weight="bold" />
                )}
                Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {tab === "files" && (
            <motion.div
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filesQuery.isPending ? (
                <div className="flex justify-center py-20">
                  <SpinnerGap
                    size={28}
                    className="animate-spin text-primary-400"
                  />
                </div>
              ) : filesQuery.isError ? (
                <div className="text-center py-20 text-sm text-gray-400">
                  Failed to load files.
                </div>
              ) : (
                <>
                  {folderView.level !== "root" && (
                    <Breadcrumb view={folderView} onNavigate={navigate} />
                  )}

                  <AnimatePresence mode="wait">
                    {/* Root — event folders */}
                    {folderView.level === "root" && (
                      <motion.div
                        key="root"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {rootEvents.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <FolderOpen size={40} weight="thin" />
                            <p className="text-sm">
                              {lowerSearch
                                ? "No events found."
                                : "No form file submissions yet."}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                              {rootEvents.map((event) => (
                                <FolderItem
                                  key={event.id}
                                  icon={<Folder size={28} weight="fill" />}
                                  name={event.name}
                                  count={event.responses.length}
                                  countLabel={
                                    event.responses.length === 1
                                      ? "respondent"
                                      : "respondents"
                                  }
                                  onClick={() =>
                                    navigate({
                                      level: "event",
                                      eventId: event.id,
                                      eventName: event.name,
                                    })
                                  }
                                />
                              ))}
                            </div>
                            {filesQuery.data?.meta && (
                              <Pagination
                                page={filesPage}
                                totalPages={filesQuery.data.meta.totalPages}
                                onPageChange={setFilesPage}
                              />
                            )}
                          </>
                        )}
                      </motion.div>
                    )}

                    {/* Event — respondent folders */}
                    {folderView.level === "event" && (
                      <motion.div
                        key="event"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {eventResponses.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <FolderOpen size={40} weight="thin" />
                            <p className="text-sm">
                              {lowerSearch
                                ? "No respondents found."
                                : "No submissions in this event."}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {eventResponses.map((response) => (
                              <FolderItem
                                key={response.id}
                                icon={<User size={26} weight="fill" />}
                                name={response.respondentLabel}
                                meta={formatDate(response.submittedAt)}
                                count={response.files.length}
                                countLabel={
                                  response.files.length === 1 ? "file" : "files"
                                }
                                onClick={() =>
                                  navigate({
                                    level: "respondent",
                                    eventId: folderView.eventId,
                                    eventName: folderView.eventName,
                                    responseId: response.id,
                                    respondentLabel: response.respondentLabel,
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Respondent — files */}
                    {folderView.level === "respondent" && (
                      <motion.div
                        key="respondent"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {respondentFiles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <File size={40} weight="thin" />
                            <p className="text-sm">
                              {lowerSearch
                                ? "No files found."
                                : "No files submitted."}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {respondentFiles.map((f, i) => (
                              <FileCard
                                key={`${f.fieldId}-${i}`}
                                url={f.url}
                                filename={f.filename}
                                fieldLabel={f.fieldLabel}
                                onDelete={() =>
                                  setDeleteTarget({
                                    url: f.url,
                                    label: f.filename,
                                  })
                                }
                                onPreview={() =>
                                  setPreviewFile({
                                    url: f.url,
                                    filename: f.filename,
                                  })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}

          {tab === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {mediaQuery.isPending ? (
                <div className="flex justify-center py-20">
                  <SpinnerGap
                    size={28}
                    className="animate-spin text-primary-400"
                  />
                </div>
              ) : mediaQuery.isError ? (
                <div className="text-center py-20 text-sm text-gray-400">
                  Failed to load media.
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <Images size={40} weight="thin" />
                  <p className="text-sm">
                    {lowerSearch
                      ? "No results found."
                      : "No media uploaded yet."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredMedia.map((item) => (
                      <MediaCard
                        key={item.key}
                        item={item}
                        onDelete={() =>
                          setDeleteTarget({
                            url: item.url,
                            label: item.filename,
                          })
                        }
                        onCopy={() => handleCopyUrl(item.url)}
                        onPreview={() =>
                          setPreviewFile({
                            url: item.url,
                            filename: item.filename,
                          })
                        }
                      />
                    ))}
                  </div>
                  {mediaQuery.data?.meta && (
                    <Pagination
                      page={mediaPage}
                      totalPages={mediaQuery.data.meta.totalPages}
                      onPageChange={setMediaPage}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete file"
        description={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      <StatusModal
        isOpen={!!status}
        type={status?.type ?? "success"}
        title={status?.type === "success" ? "Done" : "Error"}
        description={status?.message ?? ""}
        onClose={() => setStatus(null)}
      />

      <LoadingModal
        isOpen={
          (deleteMutation.isPending || uploadMutation.isPending) && !status
        }
        title={uploadMutation.isPending ? "Uploading…" : "Deleting…"}
      />

      <AnimatePresence>
        {previewFile && (
          <ImagePreviewModal
            url={previewFile.url}
            filename={previewFile.filename}
            onClose={() => setPreviewFile(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
          >
            <Link size={12} weight="bold" className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
