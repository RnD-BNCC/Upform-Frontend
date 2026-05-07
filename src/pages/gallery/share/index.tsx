import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  File,
  FolderOpen,
  LockKey,
  SignIn,
  SignOut,
  User,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import { BrandLogo, Footer } from "@/components/layout";
import { useMutationDeleteFile, useQuerySharedGallery } from "@/api/gallery";
import { ConfirmModal, StatusModal, type StatusType } from "@/components/modal";
import { useAuth } from "@/hooks";
import { authClient } from "@/lib";
import { Breadcrumb, type FolderView } from "@/components/utils";
import { FileCard, FolderItem } from "../components";
import { formatGalleryDate, getGalleryPreviewUrl } from "../utils";

export default function SharedGalleryPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending: isSessionPending } = useAuth();
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
  const [folderView, setFolderView] = useState<FolderView>({ level: "root" });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const sharedQuery = useQuerySharedGallery(
    token,
    !!session,
    !isSessionPending,
  );
  const deleteMutation = useMutationDeleteFile();

  const event = sharedQuery.data?.event;
  const role = sharedQuery.data?.role ?? "viewer";
  const canEdit = role === "editor" && !!session;
  const activeFolderView =
    folderView.level === "root" && event
      ? ({
          level: "event",
          eventId: event.id,
          eventName: event.name,
        } satisfies FolderView)
      : folderView;
  const currentResponse =
    activeFolderView.level === "respondent"
      ? event?.responses.find((response) => response.id === activeFolderView.responseId)
      : undefined;
  const files = useMemo(
    () =>
      event?.responses.flatMap((response) =>
        response.files.map((file) => ({
          ...file,
          responseId: response.id,
          respondentLabel: response.respondentLabel,
          submittedAt: response.submittedAt,
        })),
      ) ?? [],
    [event],
  );
  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const loginPath = `/login?redirect=${encodeURIComponent(
    `${location.pathname}${location.search}`,
  )}`;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleFolderNavigate = (view: FolderView) => {
    setFolderView(view);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    deleteMutation.mutate(target.url, {
      onSuccess: () => {
        setStatus({ type: "success", message: "File deleted." });
        void sharedQuery.refetch();
      },
      onError: () =>
        setStatus({ type: "error", message: "Failed to delete file." }),
    });
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await authClient.signOut();
    window.location.reload();
  };

  const isAccessDenied =
    sharedQuery.isError &&
    ((sharedQuery.error as { response?: { status?: number } }).response
      ?.status === 401 ||
      (sharedQuery.error as { response?: { status?: number } }).response
        ?.status === 403);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-8">
          <BrandLogo variant="white" className="h-7 w-auto max-w-[120px]" />
          {session ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((current) => !current)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/25 hover:border-white/50 transition-colors"
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "Avatar"}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
                    {initials}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.08, ease: "easeOut" }}
                    className="absolute right-0 top-10 w-44 bg-white rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100/80 overflow-hidden select-none"
                  >
                    <div className="px-2.5 pt-2.5 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center shrink-0">
                          {user?.image ? (
                            <img
                              src={user.image}
                              alt={user.name ?? "Avatar"}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[8px] font-bold text-primary-600">
                              {initials}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-800 truncate">
                            {user?.name ?? "My Account"}
                          </p>
                          <p className="text-[9px] text-gray-400 truncate">
                            {user?.email ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 hover:font-bold active:bg-red-100 transition-colors text-left"
                      >
                        <SignOut
                          size={12}
                          className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
                        />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => navigate(loginPath)}
              className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-primary-800"
            >
              <SignIn size={14} weight="bold" />
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
        {sharedQuery.isPending || isSessionPending ? (
          <div className="flex justify-center py-24">
            <Spinner size={30} className="text-primary-500" />
          </div>
        ) : isAccessDenied ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <LockKey size={42} className="text-gray-300" />
            <div>
              <h1 className="text-base font-bold text-gray-800">
                Access required
              </h1>
              <p className="mt-1 max-w-sm text-sm text-gray-400">
                This gallery is restricted to invited emails.
              </p>
            </div>
            <button
              onClick={() => navigate(loginPath)}
              className="rounded-md bg-primary-500 px-4 py-2 text-sm font-bold text-white"
            >
              Sign in
            </button>
          </div>
        ) : sharedQuery.isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-gray-400">
            <FolderOpen size={42} weight="thin" />
            <p className="text-sm">Shared gallery not found.</p>
          </div>
        ) : !event ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <File size={42} weight="thin" />
            <p className="text-sm">No files shared yet.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-500">
                  Shared Gallery
                </p>
                <h1 className="mt-1 text-2xl font-black text-gray-900">
                  {event.name}
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  {files.length} {files.length === 1 ? "file" : "files"} from{" "}
                  {event.responses.length}{" "}
                  {event.responses.length === 1 ? "respondent" : "respondents"}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-gray-500 shadow-sm">
                {role}
              </span>
            </div>

            {activeFolderView.level === "respondent" && (
              <Breadcrumb view={activeFolderView} onNavigate={handleFolderNavigate} />
            )}

            {activeFolderView.level === "event" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {event.responses.map((response) => (
                  <FolderItem
                    key={response.id}
                    icon={<User size={26} weight="fill" />}
                    name={response.respondentLabel}
                    meta={formatGalleryDate(response.submittedAt)}
                    count={response.files.length}
                    countLabel={response.files.length === 1 ? "file" : "files"}
                    onClick={() =>
                      handleFolderNavigate({
                        level: "respondent",
                        eventId: event.id,
                        eventName: event.name,
                        responseId: response.id,
                        respondentLabel: response.respondentLabel,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {activeFolderView.level === "respondent" && currentResponse && (
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                  <User size={14} weight="fill" />
                  <span className="font-bold text-gray-700">
                    {currentResponse.respondentLabel}
                  </span>
                  <span>{formatGalleryDate(currentResponse.submittedAt)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {currentResponse.files.map((fileEntry, index) => (
                      <FileCard
                        key={`${currentResponse.id}-${fileEntry.fieldId}-${index}`}
                        url={fileEntry.url}
                        filename={fileEntry.filename}
                        fieldLabel={fileEntry.fieldLabel}
                        fieldName={fileEntry.fieldName}
                        canDelete={canEdit}
                        onDelete={() =>
                          setDeleteTarget({
                            url: fileEntry.url,
                            label: fileEntry.filename,
                          })
                        }
                        onMissing={() => void sharedQuery.refetch()}
                        onPreview={() =>
                          setPreviewFile({
                            url: fileEntry.url,
                            filename: fileEntry.filename,
                          })
                        }
                      />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

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

      {previewFile && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <img
            src={getGalleryPreviewUrl(previewFile.url)}
            alt={previewFile.filename}
            className="max-h-full max-w-full rounded-sm object-contain"
          />
        </div>
      )}

    </div>
  );
}
