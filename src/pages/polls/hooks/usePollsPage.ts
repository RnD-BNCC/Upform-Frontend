import { useCallback, useEffect, useState } from "react";
import type { StatusType } from "@/components/modal";
import { useDeletePoll, useGetPolls, useRestorePoll } from "@/hooks/polls";
import { useResourcePermission } from "@/hooks/permissions";
import type { Poll } from "@/types/polling";
import type { PollContextMenuState, PollTab } from "@/pages/polls/types";

type StatusResult = {
  description: string;
  title: string;
  type: StatusType;
};

export function usePollsPage() {
  const [activeTab, setActiveTab] = useState<PollTab>("polls");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ctxMenu, setCtxMenu] = useState<PollContextMenuState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<StatusResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const deletePoll = useDeletePoll();
  const restorePoll = useRestorePoll();
  const deletePermission = useResourcePermission({
    action: "polls.delete",
    enabled: false,
    reason: "Need to delete poll",
    resourceId: confirmDelete?.id ?? "",
    resourceType: "poll",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const handleTabChange = useCallback((tab: PollTab) => {
    setActiveTab(tab);
    setPage(1);
    setCtxMenu(null);
  }, []);

  const { data: result, isLoading } = useGetPolls(
    page,
    debouncedSearch || undefined,
    activeTab === "trash",
  );

  const polls = result?.data ?? [];
  const meta = result?.meta;
  const counts = result?.counts;
  const isTrashTab = activeTab === "trash";
  const ctxPoll = ctxMenu
    ? (polls.find((poll) => poll.id === ctxMenu.id) ?? null)
    : null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;

    const { id, title } = confirmDelete;
    setConfirmDelete(null);
    setIsActionLoading(true);

    try {
      await deletePoll.mutateAsync(id);
      setStatusResult({
        type: "success",
        title: "Poll Deleted",
        description: `"${title}" has been moved to Temporary Delete.`,
      });
    } catch (error) {
      const permissionRequested =
        await deletePermission.requestPermissionFromError(
          error,
          "Need to delete poll",
        );

      setStatusResult(
        permissionRequested
          ? {
              type: "success",
              title: "Permission Request Sent",
              description:
                "An approver needs to approve this before the poll can be deleted.",
            }
          : {
              type: "error",
              title: "Delete Failed",
              description: "Something went wrong. Please try again.",
            },
      );
    } finally {
      setIsActionLoading(false);
    }
  }, [confirmDelete, deletePermission, deletePoll]);

  const handleRestore = useCallback(
    async (poll: Poll) => {
      setIsActionLoading(true);

      try {
        await restorePoll.mutateAsync(poll.id);
        setStatusResult({
          type: "success",
          title: "Poll Restored",
          description: `"${poll.title || "Untitled Poll"}" is back in My Polls.`,
        });
      } catch (error) {
        const permissionRequested =
          await deletePermission.requestPermissionFromError(
            error,
            "Need to restore poll",
          );

        setStatusResult(
          permissionRequested
            ? {
                type: "success",
                title: "Permission Request Sent",
                description:
                  "An approver needs to approve this before the poll can be restored.",
              }
            : {
                type: "error",
                title: "Restore Failed",
                description: "Something went wrong. Please try again.",
              },
        );
      } finally {
        setIsActionLoading(false);
      }
    },
    [deletePermission, restorePoll],
  );

  return {
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
  };
}
