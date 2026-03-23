import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, Footer } from "@/components/layout";
import {
  ConfirmModal,
  LoadingModal,
  Pagination,
  StatusModal,
} from "@/components/ui";
import { useGetPolls, useDeletePoll } from "@/hooks/polls";
import type { StatusType } from "@/components/ui/StatusModal";
import type { Poll } from "@/types/polling";
import {
  Presentation,
  PencilSimple,
  Trash,
  Copy,
  SpinnerGap,
  DotsThree,
  MagnifyingGlass,
} from "@phosphor-icons/react";

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  waiting: { label: "Waiting", dot: "bg-yellow-400" },
  active: { label: "Active", dot: "bg-emerald-400" },
  ended: { label: "Ended", dot: "bg-gray-400" },
};

const CARD_COLOR = "#0054a5";

function PollCard({
  poll,
  index,
  onContextMenu,
}: {
  poll: Poll;
  index: number;
  onContextMenu: (id: string, x: number, y: number) => void;
}) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[poll.status] ?? STATUS_CONFIG.waiting;
  const color = CARD_COLOR;

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onContextMenu(poll.id, e.clientX, e.clientY);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={() => navigate(`/polls/${poll.id}/edit`)}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e);
      }}
      className="cursor-pointer overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-200 group"
    >
      <div
        className="relative h-32 overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-white/8 via-transparent to-black/35" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute top-4 -right-4 w-24 h-24 rounded-full bg-black/10" />

        <div className="absolute top-3.5 left-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/95 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <button
          onClick={openMenu}
          className="absolute top-3 right-3 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/25 transition-all duration-150 flex items-center justify-center z-10"
          title="More options"
        >
          <DotsThree size={18} weight="bold" className="text-white" />
        </button>

        <div className="absolute inset-x-0 bottom-0 px-4 pt-10 pb-4 bg-linear-to-t from-black/40 to-transparent">
          <h3 className="text-white font-bold text-sm leading-snug line-clamp-1 drop-shadow-sm">
            {poll.title || "Untitled Poll"}
          </h3>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium">Code:</span>
          <span className="font-bold text-gray-600 tracking-wider">
            {poll.code}
          </span>
        </div>
      </div>

      <div className="px-4 pb-3 pt-1.5 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-gray-800">
            {poll.slides.length}
          </span>
          <span className="text-[10px] text-gray-400">
            slide{poll.slides.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          {new Date(poll.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </motion.div>
  );
}

function PollContextMenu({
  x,
  y,
  poll,
  onClose,
  onEdit,
  onPresent,
  onCopyCode,
  onDelete,
}: {
  x: number;
  y: number;
  poll: Poll;
  onClose: () => void;
  onEdit: () => void;
  onPresent: () => void;
  onCopyCode: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const adjustedX = Math.min(x, window.innerWidth - 204);
  const adjustedY = Math.min(y, window.innerHeight - 240);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.08, ease: "easeOut" }}
      className="fixed z-[100] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100/80 w-40 select-none overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
          Poll
        </p>
        <p
          className="text-[11px] font-semibold text-gray-800 truncate"
          title={poll.title}
        >
          {poll.title || "Untitled Poll"}
        </p>
      </div>

      <div className="h-px bg-gray-100 mx-2" />

      <div className="p-1 space-y-0.5">
        <button
          onClick={() => {
            onClose();
            onEdit();
          }}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left rounded-lg"
        >
          <PencilSimple
            size={12}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          Edit
        </button>
        <button
          onClick={() => {
            onClose();
            onPresent();
          }}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left rounded-lg"
        >
          <Presentation
            size={12}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          Present
        </button>
        <button
          onClick={() => {
            onClose();
            onCopyCode();
          }}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors text-left rounded-lg"
        >
          <Copy
            size={12}
            className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors"
          />
          Copy Code
        </button>
      </div>

      <div className="h-px bg-gray-100 mx-2" />

      <div className="p-1">
        <button
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="group w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 hover:font-bold active:bg-red-100 transition-colors text-left rounded-lg"
        >
          <Trash
            size={12}
            className="shrink-0 transition-transform group-hover:scale-110 group-active:scale-95"
          />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

export default function PollsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: result, isLoading } = useGetPolls(
    page,
    debouncedSearch || undefined,
  );
  const deletePoll = useDeletePoll();

  const polls = result?.data ?? [];
  const meta = result?.meta;

  const [ctxMenu, setCtxMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const ctxPoll = ctxMenu
    ? (polls.find((p) => p.id === ctxMenu.id) ?? null)
    : null;

  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    type: StatusType;
    title: string;
    description: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { id, title } = confirmDelete;
    setConfirmDelete(null);
    setIsActionLoading(true);
    try {
      await deletePoll.mutateAsync(id);
      setStatusResult({
        type: "success",
        title: "Poll Deleted",
        description: `"${title}" has been deleted.`,
      });
    } catch (error) {
      console.error("handleConfirmDelete:", error);
      setStatusResult({
        type: "error",
        title: "Delete Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
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

        <Navbar />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <p className="text-primary-300 text-sm font-bold mb-1">
            Live Polling
          </p>
          <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-white leading-tight">
            My Polls
          </h1>
          <p className="text-white text-sm mt-1.5">
            Create interactive live polls for your audience.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900">All Polls</h2>
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-semibold">
                {meta?.total ?? 0}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage and track your polls
            </p>
          </div>

          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlass
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search polls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52 pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white transition-all placeholder-gray-400 shadow-sm"
            />
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
              <SpinnerGap size={32} className="text-primary-500 animate-spin" />
              <p className="text-sm text-gray-400">Loading polls...</p>
            </motion.div>
          ) : polls.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24"
            >
              <Presentation size={48} className="text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500">
                  {debouncedSearch ? "No polls found" : "No polls yet"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {debouncedSearch
                    ? `No results for "${debouncedSearch}". Try a different keyword.`
                    : "Create your first live poll to engage your audience."}
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
                {polls.map((poll, i) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    index={i}
                    onContextMenu={(id, x, y) => setCtxMenu({ id, x, y })}
                  />
                ))}
              </div>

              {meta && (
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      <AnimatePresence>
        {ctxMenu && ctxPoll && (
          <PollContextMenu
            key={ctxMenu.id}
            x={ctxMenu.x}
            y={ctxMenu.y}
            poll={ctxPoll}
            onClose={() => setCtxMenu(null)}
            onEdit={() => navigate(`/polls/${ctxPoll.id}/edit`)}
            onPresent={() => navigate(`/polls/${ctxPoll.id}/present`)}
            onCopyCode={() => {
              navigator.clipboard.writeText(ctxPoll.code);
              showToast("Code copied");
            }}
            onDelete={() => {
              setCtxMenu(null);
              setConfirmDelete({
                id: ctxPoll.id,
                title: ctxPoll.title || "Untitled Poll",
              });
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Poll?"
        description={`"${confirmDelete?.title}" will be permanently deleted. This cannot be undone.`}
        confirmText="Delete"
      />
      <LoadingModal isOpen={isActionLoading} />
      <StatusModal
        isOpen={!!statusResult}
        onClose={() => setStatusResult(null)}
        type={statusResult?.type ?? "success"}
        title={statusResult?.title ?? ""}
        description={statusResult?.description ?? ""}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
          >
            <Copy size={12} weight="bold" className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
