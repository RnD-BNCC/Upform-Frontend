import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EventCard from "@/components/card/EventCard";
import { Navbar, Footer, PageGridShell } from "@/components/layout";
import { ConfirmModal, LoadingModal, StatusModal, type StatusType } from "@/components/modal";
import { NoFormsIllustrationIcon } from "@/components/icons";
import ContextMenu from "@/context/ContextMenu";
import { Pagination } from "@/components/utils";
import {
  useGetEvents,
  useDeleteEvent,
  useDuplicateEvent,
  useRestoreEvent,
  useUpdateEvent,
} from "@/hooks/events";
import { useMutationCreatePermissionRequest } from "@/api/permission-requests";
import type { EventListItem } from "@/types/api";
import type { FormEvent } from "@/types/form";
import { ArrowClockwise, MagnifyingGlass, Trash } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import { HomeHero, type HomeTab } from "./components";
import { getPermissionRequiredError } from "@/utils/permissionRequests";

type Filter = "All" | "Active" | "Draft" | "Closed";
const FILTERS: Filter[] = ["All", "Active", "Draft", "Closed"];

function formatDeletedAt(value?: string | null) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AuditLine({ label, value }: { label: string; value?: string | null }) {
  const displayValue = value || "Unknown";

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-gray-700" title={displayValue}>
        {displayValue}
      </span>
    </div>
  );
}

function DeletedFormCard({
  event,
  index,
  onRestore,
}: {
  event: EventListItem;
  index: number;
  onRestore: (event: EventListItem) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
    >
      <div className="relative h-32 overflow-hidden bg-gray-900">
        {event.image ? (
          <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 grayscale" />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-700 via-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute left-4 top-3 flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Trash size={12} weight="bold" />
          Deleted
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10 bg-linear-to-t from-black/60 to-transparent">
          <h3 className="line-clamp-1 text-sm font-bold text-white" title={event.name}>
            {event.name || "Untitled Form"}
          </h3>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-400">Deleted</span>
          <span className="font-semibold text-gray-700">{formatDeletedAt(event.deletedAt)}</span>
        </div>
        <AuditLine label="Deleted by" value={event.deletedBy} />
        <AuditLine label="Created by" value={event.createdBy} />
        <AuditLine label="Updated by" value={event.updatedBy} />
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-400">Responses</span>
          <span className="font-semibold text-gray-700">{event.responseCount}</span>
        </div>
        <button
          type="button"
          onClick={() => onRestore(event)}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-primary-600 px-3 text-xs font-bold text-white transition-colors hover:bg-primary-700"
        >
          <ArrowClockwise size={14} weight="bold" />
          Restore
        </button>
      </div>
    </motion.article>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<HomeTab>("forms");
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFilterChange = useCallback((f: Filter) => {
    setFilter(f);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((tab: HomeTab) => {
    setActiveTab(tab);
    setPage(1);
    setCtxMenu(null);
  }, []);

  const { data: result, isLoading } = useGetEvents({
    deleted: activeTab === "trash",
    page,
    take: 9,
    status:
      activeTab === "forms" && filter !== "All"
        ? (filter.toLowerCase() as "draft" | "active" | "closed")
        : undefined,
    search: debouncedSearch || undefined,
  });

  const events = result?.data ?? [];
  const meta = result?.meta;
  const counts = result?.counts;

  const deleteEvent = useDeleteEvent();
  const duplicateEvent = useDuplicateEvent();
  const restoreEvent = useRestoreEvent();
  const updateEvent = useUpdateEvent();
  const createPermissionRequest = useMutationCreatePermissionRequest();

  const [ctxMenu, setCtxMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "publish" | "unpublish" | "reopen";
    eventId: string;
    eventName: string;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    type: StatusType;
    title: string;
    description: string;
  } | null>(null);

  const handleDelete = (id: string) => {
    const event = events.find((e) => e.id === id);
    setCtxMenu(null);
    setConfirmAction({
      type: "delete",
      eventId: id,
      eventName: event?.name ?? "this form",
    });
  };

  const handleToggleStatus = (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    setCtxMenu(null);
    const actionMap: Record<string, "publish" | "unpublish" | "reopen"> = {
      draft: "publish",
      active: "unpublish",
      closed: "reopen",
    };
    setConfirmAction({
      type: actionMap[event.status] ?? "publish",
      eventId: id,
      eventName: event.name,
    });
  };

  const handleDuplicate = async (id: string) => {
    const event = events.find((e) => e.id === id);
    setCtxMenu(null);
    setIsActionLoading(true);
    try {
      const duplicated = await duplicateEvent.mutateAsync(id);
      setStatusResult({
        type: "success",
        title: "Form Duplicated",
        description: `"${event?.name ?? "Form"}" has been duplicated as "${duplicated.name}".`,
      });
    } catch (error) {
      console.error('[handleDuplicate]', error)
      setStatusResult({
        type: "error",
        title: "Duplicate Failed",
        description: "Something went wrong while duplicating the form.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestore = async (event: EventListItem) => {
    setIsActionLoading(true);
    try {
      await restoreEvent.mutateAsync(event.id);
      setStatusResult({
        type: "success",
        title: "Form Restored",
        description: `"${event.name || "Untitled Form"}" is back in My Forms.`,
      });
    } catch (error) {
      console.error("[handleRestore]", error);
      setStatusResult({
        type: "error",
        title: "Restore Failed",
        description: "Something went wrong while restoring the form.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    setIsActionLoading(true);
    try {
      if (action.type === "delete") {
        await deleteEvent.mutateAsync(action.eventId);
        setStatusResult({
          type: "success",
          title: "Form Deleted",
          description: `"${action.eventName}" has been deleted.`,
        });
      } else {
        const statusMap: Record<string, FormEvent["status"]> = {
          publish: "active",
          unpublish: "draft",
          reopen: "active",
        };
        await updateEvent.mutateAsync({
          eventId: action.eventId,
          status: statusMap[action.type],
        });
        const successMessages: Record<string, { title: string; description: string }> = {
          publish: { title: "Form Published", description: `"${action.eventName}" is now live and accepting responses.` },
          unpublish: { title: "Form Unpublished", description: `"${action.eventName}" has been moved back to draft.` },
          reopen: { title: "Form Reopened", description: `"${action.eventName}" is now live again.` },
        };
        setStatusResult({
          type: "success",
          ...successMessages[action.type],
        });
      }
    } catch (error) {
      console.error('[handleConfirm]', error)
      const permissionError = getPermissionRequiredError(error);
      if (permissionError) {
        createPermissionRequest.mutate({
          action: permissionError.action,
          reason: "Need to delete form",
          resourceId: permissionError.resourceId,
          resourceType: permissionError.resourceType,
        });
        setStatusResult({
          type: "success",
          title: "Permission Requested",
          description: "Your request has been sent to the approver.",
        });
      } else {
        setStatusResult({
          type: "error",
          title: "Action Failed",
          description: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const ctxEvent = ctxMenu
    ? (events.find((e) => e.id === ctxMenu.id) ?? null)
    : null;
  const isTrashTab = activeTab === "trash";

  return (
    <PageGridShell>
      <Navbar />

      <HomeHero
        activeTab={activeTab}
        totalForms={counts?.total ?? 0}
        activeForms={counts?.active ?? 0}
        deletedForms={counts?.deleted ?? 0}
        totalResponses={counts?.totalResponses ?? 0}
        onTabChange={handleTabChange}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900">
                {isTrashTab ? "Temporary Delete" : "All Forms"}
              </h2>
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-semibold">
                {meta?.total ?? 0}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isTrashTab
                ? "Deleted forms are hidden from My Forms and public access"
                : "Manage and track your forms"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="relative flex-1 sm:flex-none">
              <MagnifyingGlass
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder={isTrashTab ? "Search deleted forms..." : "Search forms..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all placeholder-gray-400 shadow-sm"
              />
            </div>

            {!isTrashTab && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`text-xs px-3 sm:px-3.5 py-1.5 rounded-sm font-medium transition-all ${
                      filter === f
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-gray-500 bg-white border border-gray-200 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 sm:py-24"
            >
              <Spinner size={32} className="text-primary-500" />
              <p className="text-sm text-gray-400">Loading forms...</p>
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24"
            >
              <NoFormsIllustrationIcon />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500">
                  {isTrashTab ? "No deleted forms" : "No forms found"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {debouncedSearch
                    ? `No results for "${debouncedSearch}". Try a different keyword.`
                    : isTrashTab
                      ? "Forms you delete will show up here."
                      : "Try a different filter, or create a new form."}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {events.map((event, i) =>
                  isTrashTab ? (
                    <DeletedFormCard
                      key={event.id}
                      event={event}
                      index={i}
                      onRestore={handleRestore}
                    />
                  ) : (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={i}
                      onContextMenu={(id, x, y) => setCtxMenu({ id, x, y })}
                    />
                  ),
                )}
              </div>

              {meta && (
                <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      <AnimatePresence>
        {!isTrashTab && ctxMenu && ctxEvent && (
          <ContextMenu
            key={ctxMenu.id}
            x={ctxMenu.x}
            y={ctxMenu.y}
            event={ctxEvent}
            onClose={() => setCtxMenu(null)}
            onOpen={() => {
              navigate(`/forms/${ctxEvent.id}`);
              setCtxMenu(null);
            }}
            onEdit={() => {
              navigate(`/forms/${ctxEvent.id}/edit`);
              setCtxMenu(null);
            }}
            onDuplicate={() => void handleDuplicate(ctxEvent.id)}
            onDelete={() => handleDelete(ctxEvent.id)}
            onToggleStatus={() => handleToggleStatus(ctxEvent.id)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        variant={confirmAction?.type === "delete" ? "danger" : "warning"}
        title={
          confirmAction?.type === "delete" ? "Delete Form?"
            : confirmAction?.type === "publish" ? "Publish Form?"
            : confirmAction?.type === "unpublish" ? "Unpublish Form?"
            : "Reopen Form?"
        }
        description={
          confirmAction?.type === "delete"
            ? `"${confirmAction.eventName}" will move to Temporary Delete. Responses will be hidden until the form is restored.`
            : confirmAction?.type === "publish"
              ? `"${confirmAction?.eventName}" will go live and start accepting responses.`
              : confirmAction?.type === "unpublish"
                ? `"${confirmAction?.eventName}" will be moved back to draft and stop accepting responses.`
                : `"${confirmAction?.eventName}" will go live again and start accepting responses.`
        }
        confirmText={
          confirmAction?.type === "delete" ? "Move to Trash"
            : confirmAction?.type === "publish" ? "Publish"
            : confirmAction?.type === "unpublish" ? "Unpublish"
            : "Reopen"
        }
      />

      <LoadingModal isOpen={isActionLoading} />

      <StatusModal
        isOpen={!!statusResult}
        onClose={() => setStatusResult(null)}
        type={statusResult?.type ?? "success"}
        title={statusResult?.title ?? ""}
        description={statusResult?.description ?? ""}
      />
    </PageGridShell>
  );
}
