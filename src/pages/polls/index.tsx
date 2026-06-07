import { Copy } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Footer, Navbar, PageGridShell, PageHeroBanner } from "@/components/layout";
import { ConfirmModal, LoadingModal, StatusModal } from "@/components/modal";
import { ActionToast } from "@/components/ui";
import { Pagination } from "@/components/utils";
import {
  PollContextMenu,
  PollGrid,
  PollsEmptyState,
  PollsHero,
  PollsLoadingState,
  PollsToolbar,
} from "@/pages/polls/components/list";
import { usePollsPage } from "@/pages/polls/hooks";

export default function PollsPage() {
  const navigate = useNavigate();
  const {
    activeTab,
    confirmDelete,
    counts,
    ctxMenu,
    ctxPoll,
    debouncedSearch,
    handleConfirmDelete,
    handleRestore,
    handleTabChange,
    isActionLoading,
    isLoading,
    isTrashTab,
    meta,
    page,
    polls,
    search,
    setConfirmDelete,
    setCtxMenu,
    setPage,
    setSearch,
    setStatusResult,
    showToast,
    statusResult,
    toast,
  } = usePollsPage();

  return (
    <PageGridShell>
      <Navbar />

      <PageHeroBanner contentClassName="pt-8 sm:pt-12">
        <PollsHero
          activeTab={activeTab}
          deletedCount={counts?.deleted ?? 0}
          onTabChange={handleTabChange}
          totalCount={counts?.total ?? 0}
        />
      </PageHeroBanner>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <PollsToolbar
          isTrashTab={isTrashTab}
          onSearchChange={setSearch}
          search={search}
          total={meta?.total ?? 0}
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <PollsLoadingState />
          ) : polls.length === 0 ? (
            <PollsEmptyState
              debouncedSearch={debouncedSearch}
              isTrashTab={isTrashTab}
            />
          ) : (
            <PollGrid
              isTrashTab={isTrashTab}
              onContextMenu={(id, x, y) => setCtxMenu({ id, x, y })}
              onRestore={handleRestore}
              polls={polls}
            />
          )}
        </AnimatePresence>

        {!isLoading && polls.length > 0 && meta ? (
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </main>

      <Footer />

      <AnimatePresence>
        {!isTrashTab && ctxMenu && ctxPoll ? (
          <PollContextMenu
            key={ctxMenu.id}
            x={ctxMenu.x}
            y={ctxMenu.y}
            poll={ctxPoll}
            onClose={() => setCtxMenu(null)}
            onEdit={() => navigate(`/polls/${ctxPoll.id}/edit`)}
            onMonitorQNA={() => navigate(`/polls/${ctxPoll.id}/qna-monitor`)}
            onPresent={() => navigate(`/polls/${ctxPoll.id}/present`)}
            onCopyCode={() => {
              void navigator.clipboard.writeText(ctxPoll.code);
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
        ) : null}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        variant="danger"
        title="Delete Poll?"
        description={`"${confirmDelete?.title}" will move to Temporary Delete and be hidden from Live Polls and public access until restored.`}
        confirmText="Move to Trash"
      />
      <LoadingModal isOpen={isActionLoading} />
      <StatusModal
        isOpen={!!statusResult}
        onClose={() => setStatusResult(null)}
        type={statusResult?.type ?? "success"}
        title={statusResult?.title ?? ""}
        description={statusResult?.description ?? ""}
      />

      <ActionToast
        message={toast}
        icon={<Copy size={12} weight="bold" className="text-emerald-400" />}
      />
    </PageGridShell>
  );
}
