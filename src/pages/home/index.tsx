import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EventCard } from "@/components/card";
import { Navbar, Footer, PageGridShell } from "@/components/layout";
import { ConfirmModal, LoadingModal, StatusModal, type StatusType } from "@/components/modal";
import { NoFormsIllustration } from "@/components/icons";
import { ContextMenu } from "@/context";
import { Pagination } from "@/components/utils";
import { useGetEvents, useDeleteEvent, useUpdateEvent } from "@/hooks/events";
import type { FormEvent } from "@/types/form";
import { MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
import { HomeHero } from "./components";

type Filter = "All" | "Active" | "Draft" | "Closed";
const FILTERS: Filter[] = ["All", "Active", "Draft", "Closed"];

export default function HomePage() {
  const navigate = useNavigate();

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

  const { data: result, isLoading } = useGetEvents({
    page,
    take: 9,
    status: filter === "All" ? undefined : (filter.toLowerCase() as "draft" | "active" | "closed"),
    search: debouncedSearch || undefined,
  });

  const events = result?.data ?? [];
  const meta = result?.meta;
  const counts = result?.counts;

  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();

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
      setStatusResult({
        type: "error",
        title: "Action Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const ctxEvent = ctxMenu
    ? (events.find((e) => e.id === ctxMenu.id) ?? null)
    : null;

  return (
    <PageGridShell>
      <Navbar />

      <HomeHero
        totalForms={counts?.total ?? 0}
        activeForms={counts?.active ?? 0}
        totalResponses={counts?.totalResponses ?? 0}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900">All Forms</h2>
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-semibold">
                {meta?.total ?? 0}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage and track your forms
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
                placeholder="Search forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-52 pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all placeholder-gray-400 shadow-sm"
              />
            </div>

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
              <SpinnerGap
                size={32}
                className="text-primary-500 animate-spin"
              />
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
              <NoFormsIllustration />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500">
                  No forms found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {debouncedSearch
                    ? `No results for "${debouncedSearch}". Try a different keyword.`
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
                {events.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={i}
                    onContextMenu={(id, x, y) => setCtxMenu({ id, x, y })}
                  />
                ))}
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
        {ctxMenu && ctxEvent && (
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
            ? `"${confirmAction.eventName}" will be permanently deleted. This cannot be undone.`
            : confirmAction?.type === "publish"
              ? `"${confirmAction?.eventName}" will go live and start accepting responses.`
              : confirmAction?.type === "unpublish"
                ? `"${confirmAction?.eventName}" will be moved back to draft and stop accepting responses.`
                : `"${confirmAction?.eventName}" will go live again and start accepting responses.`
        }
        confirmText={
          confirmAction?.type === "delete" ? "Delete"
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
