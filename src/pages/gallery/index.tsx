import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar, Footer, PageGridShell } from "@/components/layout";
import {
  ConfirmModal,
  LoadingModal,
  StatusModal,
  type StatusType,
} from "@/components/modal";
import { Breadcrumb, Pagination, type FolderView } from "@/components/utils";
import {
  useQueryGalleryFiles,
  useQueryGalleryMedia,
  useMutationDeleteFile,
} from "@/api/gallery";
import { useMutationUploadImage } from "@/api/upload";
import {
  File,
  Folder,
  FolderOpen,
  Images,
  Link,
  MagnifyingGlass,
  SpinnerGap,
  UploadSimple,
  User,
} from "@phosphor-icons/react";
import {
  FileCard,
  FolderItem,
  GalleryHero,
  ImagePreviewModal,
  MediaCard,
} from "./components";
import {
  filterGalleryEvents,
  filterGalleryFiles,
  filterGalleryMedia,
  filterGalleryResponses,
  findGalleryEvent,
  findGalleryResponse,
  formatGalleryDate,
  getGallerySearchPlaceholder,
  type GalleryTab,
} from "./utils";

export default function GalleryPage() {
  const [tab, setTab] = useState<GalleryTab>("files");
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

  const toastTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const filesQuery = useQueryGalleryFiles(filesPage, 20);
  const mediaQuery = useQueryGalleryMedia(mediaPage, 21);
  const deleteMutation = useMutationDeleteFile();
  const uploadMutation = useMutationUploadImage();

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setToast(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const lowerSearch = search.toLowerCase().trim();
  const allEvents = filesQuery.data?.events ?? [];
  const rootEvents = filterGalleryEvents(allEvents, lowerSearch);
  const currentEvent = findGalleryEvent(allEvents, folderView);
  const eventResponses = filterGalleryResponses(
    currentEvent?.responses ?? [],
    lowerSearch,
  );
  const currentResponse = findGalleryResponse(
    currentEvent?.responses ?? [],
    folderView,
  );
  const respondentFiles = filterGalleryFiles(
    currentResponse?.files ?? [],
    lowerSearch,
  );
  const filteredMedia = filterGalleryMedia(
    mediaQuery.data?.items ?? [],
    lowerSearch,
  );

  const totalFiles = filesQuery.data?.totalFiles ?? 0;
  const totalMedia =
    mediaQuery.data?.meta.total ?? mediaQuery.data?.items.length ?? 0;
  const searchPlaceholder = getGallerySearchPlaceholder(tab, folderView);

  const handleFolderNavigate = useCallback((view: FolderView) => {
    setFolderView(view);
    setSearch("");
    setFilesPage(1);
  }, []);

  const handleTabChange = useCallback((nextTab: GalleryTab) => {
    setTab(nextTab);
    setSearch("");
    setFolderView({ level: "root" });
    setFilesPage(1);
    setMediaPage(1);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setDeleteTarget(null);
    deleteMutation.mutate(target.url, {
      onSuccess: () => setStatus({ type: "success", message: "File deleted." }),
      onError: () =>
        setStatus({ type: "error", message: "Failed to delete file." }),
    });
  }, [deleteMutation, deleteTarget]);

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
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

      event.target.value = "";
    },
    [queryClient, uploadMutation],
  );

  const handleCopyUrl = useCallback(
    (url: string) => {
      void navigator.clipboard.writeText(url);
      showToast("URL copied");
    },
    [showToast],
  );

  return (
    <PageGridShell>
      <Navbar />

      <GalleryHero
        tab={tab}
        totalFiles={totalFiles}
        totalMedia={totalMedia}
        onTabChange={handleTabChange}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
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
                    <Breadcrumb
                      view={folderView}
                      onNavigate={handleFolderNavigate}
                    />
                  )}

                  <AnimatePresence mode="wait">
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
                                    handleFolderNavigate({
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
                                meta={formatGalleryDate(response.submittedAt)}
                                count={response.files.length}
                                countLabel={
                                  response.files.length === 1 ? "file" : "files"
                                }
                                onClick={() =>
                                  handleFolderNavigate({
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
                            {respondentFiles.map((fileEntry, index) => (
                              <FileCard
                                key={`${fileEntry.fieldId}-${index}`}
                                url={fileEntry.url}
                                filename={fileEntry.filename}
                                fieldLabel={fileEntry.fieldLabel}
                                onDelete={() =>
                                  setDeleteTarget({
                                    url: fileEntry.url,
                                    label: fileEntry.filename,
                                  })
                                }
                                onPreview={() =>
                                  setPreviewFile({
                                    url: fileEntry.url,
                                    filename: fileEntry.filename,
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
        title={uploadMutation.isPending ? "Uploading..." : "Deleting..."}
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
    </PageGridShell>
  );
}
