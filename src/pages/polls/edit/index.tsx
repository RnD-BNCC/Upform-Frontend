import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FloppyDisk, Presentation } from "@phosphor-icons/react";
import {
  useMutationCreateSlide,
  useMutationDeleteSlide,
  useMutationReorderSlides,
  useMutationUpdatePoll,
} from "@/api/polls";
import { QUERY_KEYS } from "@/api/queryKeys";
import { apiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import { ConfirmModal, LoadingModal, StatusModal } from "@/components/modal";
import type { StatusType } from "@/components/modal";
import { PermissionRequiredPanel } from "@/components/permissions";
import { ActionToast, RenameModal, Spinner } from "@/components/ui";
import { useAuth } from "@/hooks";
import { useCreatePoll, useGetPollDetail } from "@/hooks/polls";
import { useResourcePermission } from "@/hooks/permissions";
import type { Poll, PollSlide } from "@/types/polling";
import type { ResourceVisibility } from "@/types/api";
import type { ThemePreset } from "@/config/polling";
import {
  PollEditorLargeScreenNotice,
  PollQNAMonitorPanel,
  PollResultsPanel,
  PollSystemLogsPanel,
  PollThemePickerModal,
  SlideEditorBridge,
  SlidesSidebar,
} from "@/pages/polls/edit/components";
import type {
  EditorSaveStatus,
  PollEditorRouteState,
} from "@/pages/polls/edit/types";
import {
  DEFAULT_POLL_THEME,
  applyThemeToPollSlides,
  createLocalPoll,
  createLocalSlide,
  getThemeSlideSettings,
} from "@/pages/polls/edit/utils";

export default function PollEditPage() {
  const { id: pollId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: session } = useAuth();
  const routeState = location.state as PollEditorRouteState | null;
  const isLocalNewPoll = pollId === "new";
  const persistedPollId = isLocalNewPoll ? "" : (pollId ?? "");
  const {
    isAllowed: hasPermissionAccess,
    isChecking: isPermissionChecking,
    isPending: isPermissionPending,
    isRequested: isPermissionRequested,
    isRequesting: isRequestingPermission,
    isRequired: isPermissionRequired,
    requestPermission,
    requestPermissionFromError,
  } = useResourcePermission({
    action: "polls.edit",
    enabled: !isLocalNewPoll && !!persistedPollId,
    reason: "Need to edit poll",
    resourceId: persistedPollId,
    resourceType: "poll",
  });
  const hasEditAccess = isLocalNewPoll || hasPermissionAccess;
  const routePoll =
    hasEditAccess && !isLocalNewPoll ? routeState?.poll : undefined;

  const [localPoll, setLocalPoll] = useState<Poll | null>(() =>
    isLocalNewPoll ? createLocalPoll(DEFAULT_POLL_THEME) : (routePoll ?? null),
  );
  const { data: fetchedPoll, isLoading } = useGetPollDetail(
    persistedPollId,
    hasEditAccess,
  );
  const poll = localPoll ?? fetchedPoll ?? routePoll;
  const canManageAccess =
    ((session?.user as { role?: string } | undefined)?.role ?? "admin") !==
    "activist";
  const createPoll = useCreatePoll();
  const updatePoll = useMutationUpdatePoll();
  const createSlide = useMutationCreateSlide(persistedPollId);
  const deleteSlide = useMutationDeleteSlide(persistedPollId);
  const reorderSlides = useMutationReorderSlides(persistedPollId);

  const [selectedIndex, setSelectedIndex] = useState(
    routeState?.selectedIndex ?? 0,
  );
  const [activePanel, setActivePanel] =
    useState<"edit" | "logs" | "qna" | "results">("edit");
  const [title, setTitle] = useState(poll?.title ?? "");
  const [titleInit, setTitleInit] = useState(Boolean(poll));
  const [welcomeThemePicker, setWelcomeThemePicker] = useState(isLocalNewPoll);
  const [welcomeRename, setWelcomeRename] = useState(false);
  const [pendingTheme, setPendingTheme] =
    useState<ThemePreset>(DEFAULT_POLL_THEME);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<EditorSaveStatus>("saved");
  const slideSaveRef = useRef<(() => void) | null>(null);
  const saveReorderRef = useRef<(() => void) | null>(null);
  const routeIdRef = useRef(pollId);
  const titleRef = useRef(title);
  const savedTitleRef = useRef(title);
  const titleSaveTimerRef = useRef<number | null>(null);
  const isTitleSavingRef = useRef(false);

  const [confirmModal, setConfirmModal] = useState<{
    description: string;
    onConfirm: () => void;
    open: boolean;
    title: string;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    description: string;
    open: boolean;
    title: string;
    type: StatusType;
  }>({ open: false, type: "success", title: "", description: "" });

  const showToast = useCallback((message = "Saved successfully") => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const saveTitle = useCallback(async () => {
    if (!persistedPollId) return false;
    const nextTitle = titleRef.current;
    if (nextTitle === savedTitleRef.current) return true;
    if (isTitleSavingRef.current) return false;

    isTitleSavingRef.current = true;
    setSaveStatus("saving");

    try {
      await updatePoll.mutateAsync({ pollId: persistedPollId, title: nextTitle });
      savedTitleRef.current = nextTitle;
      setSaveStatus("saved");
      return true;
    } catch (error) {
      const permissionRequested = await requestPermissionFromError(
        error,
        "Need to edit poll",
      );
      console.error("[PollTitleSave]", error);
      setSaveStatus(permissionRequested ? "unsaved" : "error");
      return false;
    } finally {
      isTitleSavingRef.current = false;
      if (titleRef.current !== savedTitleRef.current) {
        window.setTimeout(() => {
          void saveTitle();
        }, 0);
      }
    }
  }, [persistedPollId, requestPermissionFromError, updatePoll]);

  useEffect(() => {
    if (!persistedPollId || !titleInit) return;

    if (title === savedTitleRef.current) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("unsaved");
    if (titleSaveTimerRef.current) {
      window.clearTimeout(titleSaveTimerRef.current);
    }
    titleSaveTimerRef.current = window.setTimeout(() => {
      void saveTitle();
    }, 900);

    return () => {
      if (titleSaveTimerRef.current) {
        window.clearTimeout(titleSaveTimerRef.current);
        titleSaveTimerRef.current = null;
      }
    };
  }, [persistedPollId, saveTitle, title, titleInit]);

  useEffect(() => {
    return () => {
      if (titleSaveTimerRef.current) {
        window.clearTimeout(titleSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (routeIdRef.current === pollId) return;

    routeIdRef.current = pollId;
    setSelectedIndex(routeState?.selectedIndex ?? 0);
    setActivePanel("edit");
    setTitleInit(false);
    setWelcomeThemePicker(pollId === "new");
    setWelcomeRename(false);

    if (pollId === "new") {
      const draftPoll = createLocalPoll(DEFAULT_POLL_THEME);
      setLocalPoll(draftPoll);
      setTitle(draftPoll.title);
      savedTitleRef.current = draftPoll.title;
      setTitleInit(true);
      setPendingTheme(DEFAULT_POLL_THEME);
      return;
    }

    setLocalPoll(hasEditAccess ? (routeState?.poll ?? null) : null);
    if (hasEditAccess && routeState?.poll) {
      setTitle(routeState.poll.title);
      savedTitleRef.current = routeState.poll.title;
      setTitleInit(true);
    }
  }, [hasEditAccess, pollId, routeState?.poll, routeState?.selectedIndex]);

  useEffect(() => {
    if (isLocalNewPoll && routeState?.isNewDraft) {
      window.history.replaceState({}, "");
    }
    if (!isLocalNewPoll && routeState?.poll) {
      window.history.replaceState({}, "");
    }
  }, [isLocalNewPoll, routeState?.isNewDraft, routeState?.poll]);

  useEffect(() => {
    if (!isLocalNewPoll && fetchedPoll) {
      setLocalPoll(null);
    }
  }, [fetchedPoll, isLocalNewPoll]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (persistedPollId && title) {
          void saveTitle();
          slideSaveRef.current?.();
          saveReorderRef.current?.();
        }
        showToast();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [persistedPollId, saveTitle, showToast, title]);

  useEffect(() => {
    if (poll && !titleInit) {
      setTitle(poll.title);
      savedTitleRef.current = poll.title;
      setTitleInit(true);
    }
  }, [poll, titleInit]);

  if (isPermissionChecking) {
    return (
      <>
        <PollEditorLargeScreenNotice onBack={() => navigate("/polls")} />
        <div className="hidden min-h-screen items-center justify-center bg-gray-50 lg:flex">
          <Spinner size={32} className="text-primary-500" />
        </div>
      </>
    );
  }

  if (isPermissionRequired) {
    return (
      <>
        <PollEditorLargeScreenNotice onBack={() => navigate("/polls")} />
        <PermissionRequiredPanel
          desktopOnly
          description="Your account needs approval before editing this poll."
          isRequesting={isRequestingPermission}
          onBack={() => navigate("/polls")}
          onRequest={requestPermission}
          requestDisabled={isPermissionPending || isPermissionRequested}
        />
      </>
    );
  }

  if ((isLoading && !poll) || !poll) {
    return (
      <>
        <PollEditorLargeScreenNotice onBack={() => navigate("/polls")} />
        <div className="hidden min-h-screen items-center justify-center bg-gray-50 lg:flex">
          <Spinner size={32} className="text-primary-500" />
        </div>
      </>
    );
  }

  const slides = poll.slides;
  const selectedSlide = slides[selectedIndex];
  const selectedSlideId = selectedSlide?.id;
  const selectedSlideType = selectedSlide?.type;

  const handleSaveTitle = () => {
    if (!persistedPollId) return;
    void saveTitle();
  };

  const handleSave = () => {
    if (persistedPollId && title) {
      void saveTitle();
      slideSaveRef.current?.();
      saveReorderRef.current?.();
    }
    showToast();
  };

  const handleAddSlide = () => {
    if (!persistedPollId) {
      const newSlide = createLocalSlide(pendingTheme);
      setLocalPoll((current) => {
        const source = current ?? createLocalPoll(pendingTheme);
        return {
          ...source,
          slides: [...source.slides, { ...newSlide, order: source.slides.length }],
        };
      });
      setSelectedIndex(slides.length);
      return;
    }

    setLoadingModal(true);
    setSaveStatus("saving");
    createSlide.mutate(
      {},
      {
        onSuccess: () => {
          setLoadingModal(false);
          setSaveStatus("saved");
          setSelectedIndex(slides.length);
          setStatusModal({
            open: true,
            type: "success",
            title: "Slide Added",
            description: "New slide has been created successfully.",
          });
        },
        onError: (error) => {
          void requestPermissionFromError(error, "Need to edit poll");
          setLoadingModal(false);
          setSaveStatus("error");
          setStatusModal({
            open: true,
            type: "error",
            title: "Failed",
            description: "Could not create slide. Please try again.",
          });
        },
      },
    );
  };

  const handleDeleteSlide = (slideId: string) => {
    setConfirmModal({
      open: true,
      title: "Delete Slide",
      description:
        "Are you sure you want to delete this slide? This action cannot be undone.",
      onConfirm: () => {
        setConfirmModal((state) => ({ ...state, open: false }));
        if (!persistedPollId) {
          setLocalPoll((current) => {
            if (!current || current.slides.length <= 1) return current;
            const nextSlides = current.slides
              .filter((slide) => slide.id !== slideId)
              .map((slide, order) => ({ ...slide, order }));
            return { ...current, slides: nextSlides };
          });
          if (selectedIndex >= slides.length - 1) {
            setSelectedIndex(Math.max(0, slides.length - 2));
          }
          return;
        }

        setLoadingModal(true);
        setSaveStatus("saving");
        deleteSlide.mutate(slideId, {
          onSuccess: () => {
            setLoadingModal(false);
            setSaveStatus("saved");
            if (selectedIndex >= slides.length - 1) {
              setSelectedIndex(Math.max(0, slides.length - 2));
            }
            setStatusModal({
              open: true,
              type: "success",
              title: "Deleted",
              description: "Slide has been removed successfully.",
            });
          },
          onError: (error) => {
            void requestPermissionFromError(error, "Need to edit poll");
            setLoadingModal(false);
            setSaveStatus("error");
            setStatusModal({
              open: true,
              type: "error",
              title: "Failed",
              description: "Could not delete slide. Please try again.",
            });
          },
        });
      },
    });
  };

  const handleReorderSlides = (orderedIds: string[]) => {
    const selectedSlideId = slides[selectedIndex]?.id;
    if (!persistedPollId) {
      setLocalPoll((current) => {
        if (!current) return current;
        const orderedSlides = orderedIds
          .map((id) => current.slides.find((slide) => slide.id === id))
          .filter((slide): slide is PollSlide => Boolean(slide))
          .map((slide, order) => ({ ...slide, order }));
        return { ...current, slides: orderedSlides };
      });
      if (selectedSlideId) {
        const newIndex = orderedIds.indexOf(selectedSlideId);
        if (newIndex !== -1) setSelectedIndex(newIndex);
      }
      return;
    }

    setSaveStatus("saving");
    reorderSlides.mutate(orderedIds, {
      onSuccess: () => {
        if (selectedSlideId) {
          const newIndex = orderedIds.indexOf(selectedSlideId);
          if (newIndex !== -1) setSelectedIndex(newIndex);
        }
        setSaveStatus("saved");
      },
      onError: (error) => {
        void requestPermissionFromError(error, "Need to edit poll");
        setSaveStatus("error");
      },
    });
  };

  const copyCode = () => void navigator.clipboard.writeText(poll.code);
  const handlePresent = () => {
    if (persistedPollId) navigate(`/polls/${persistedPollId}/present`);
  };
  const handleVisibilityChange = async (visibility: ResourceVisibility) => {
    if (!persistedPollId || poll.visibility === visibility) return;
    setSaveStatus("saving");
    try {
      const updatedPoll = await updatePoll.mutateAsync({
        pollId: persistedPollId,
        visibility,
      });
      setLocalPoll((current) =>
        current ? { ...current, visibility: updatedPoll.visibility } : current,
      );
      setSaveStatus("saved");
      showToast("Access updated");
    } catch (error) {
      void requestPermissionFromError(error, "Need to edit poll");
      setSaveStatus("error");
    }
  };
  const handleSelectSlide = (index: number) => {
    setSelectedIndex(index);
    setActivePanel("edit");
  };

  const applyInitialThemeToPersistedPoll = async (
    sourcePoll: Poll,
    theme: ThemePreset,
  ) => {
    const themeSettings = getThemeSlideSettings(theme);
    const firstSlide = sourcePoll.slides[0];
    let nextPoll = sourcePoll;

    if (firstSlide) {
      const { data: updatedSlide } = await apiClient.patch<PollSlide>(
        Api.pollSlideDetail(sourcePoll.id, firstSlide.id),
        {
          settings: {
            ...(firstSlide.settings ?? {}),
            ...themeSettings,
          },
        },
      );

      nextPoll = {
        ...sourcePoll,
        slides: sourcePoll.slides.map((slide) =>
          slide.id === updatedSlide.id ? updatedSlide : slide,
        ),
      };
    } else {
      const { data: createdSlide } = await apiClient.post<PollSlide>(
        Api.pollSlides(sourcePoll.id),
        {
          options: ["Option 1", "Option 2"],
          question: "Multiple choice",
          settings: themeSettings,
          type: "multiple_choice",
        },
      );

      nextPoll = {
        ...sourcePoll,
        slides: [createdSlide],
      };
    }

    queryClient.setQueryData([QUERY_KEYS.POLL_DETAIL, sourcePoll.id], nextPoll);
    return nextPoll;
  };

  const handleThemeContinue = (theme: ThemePreset) => {
    setPendingTheme(theme);
    setLocalPoll((current) =>
      current ? applyThemeToPollSlides(current, theme) : current,
    );
    setWelcomeThemePicker(false);
    setWelcomeRename(true);
  };

  const handleCreatePollFromDraft = async (
    name: string,
    visibility: "private" | "public" = "private",
  ) => {
    setIsCreatingPoll(true);
    try {
      const createdPoll = await createPoll.mutateAsync({ title: name, visibility });
      const themedPoll = await applyInitialThemeToPersistedPoll(
        createdPoll,
        pendingTheme,
      );
      setTitle(name);
      savedTitleRef.current = name;
      setSaveStatus("saved");
      setLocalPoll(themedPoll);
      setWelcomeThemePicker(false);
      setWelcomeRename(false);
      navigate(`/polls/${createdPoll.id}/edit`, {
        replace: true,
        state: {
          poll: themedPoll,
          selectedIndex: 0,
        } satisfies PollEditorRouteState,
      });
    } finally {
      setIsCreatingPoll(false);
    }
  };

  return (
    <>
      <PollEditorLargeScreenNotice onBack={() => navigate("/polls")} />
      <div
        className="hidden h-screen min-h-screen flex-col overflow-hidden bg-gray-50 lg:flex lg:flex-row"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <SlidesSidebar
          activePanel={activePanel}
          title={title}
          pollCode={poll.code}
          pollVisibility={poll.visibility ?? "private"}
          slides={slides}
          selectedIndex={selectedIndex}
          selectedSlideType={selectedSlideType}
          liveQuestion={liveQuestion}
          onBack={() => navigate("/polls")}
          onTitleChange={setTitle}
          onTitleBlur={handleSaveTitle}
          onSelectSlide={handleSelectSlide}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onReorderSlides={handleReorderSlides}
          saveReorderRef={saveReorderRef}
          onCopyCode={copyCode}
          onPresent={handlePresent}
          onVisibilityChange={
            canManageAccess ? (visibility) => void handleVisibilityChange(visibility) : undefined
          }
          onSave={handleSave}
          onShowEdit={() => setActivePanel("edit")}
          onShowLogs={() => setActivePanel("logs")}
          onShowQnaMonitor={() => {
            if (selectedSlideType === "qa") setActivePanel("qna");
          }}
          onShowResults={() => setActivePanel("results")}
          isAddPending={createSlide.isPending}
          saveStatus={saveStatus}
        />

        {activePanel === "results" ? (
          <PollResultsPanel pollId={persistedPollId} title={title} />
        ) : activePanel === "qna" ? (
          <PollQNAMonitorPanel
            poll={poll}
            pollId={persistedPollId}
            selectedSlideId={selectedSlideId}
          />
        ) : activePanel === "logs" ? (
          <PollSystemLogsPanel pollId={persistedPollId} title={title} />
        ) : selectedSlide ? (
          <SlideEditorBridge
            key={selectedSlide.id}
            slide={selectedSlide}
            pollId={persistedPollId}
            code={poll.code}
            saveRef={slideSaveRef}
            onSaved={showToast}
            onSaveStatusChange={setSaveStatus}
            onQuestionLive={setLiveQuestion}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-32 pt-32 text-center sm:pt-0">
            <Presentation size={48} className="mb-4 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">
              No slide selected
            </p>
            <p className="mt-1 text-xs text-gray-300">
              Choose a slide from the sidebar or create a new one
            </p>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal((state) => ({ ...state, open: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
        <LoadingModal isOpen={loadingModal} />
        <StatusModal
          isOpen={statusModal.open}
          onClose={() => setStatusModal((state) => ({ ...state, open: false }))}
          type={statusModal.type}
          title={statusModal.title}
          description={statusModal.description}
        />

        <PollThemePickerModal
          defaultTheme={DEFAULT_POLL_THEME}
          isOpen={welcomeThemePicker}
          onContinue={handleThemeContinue}
        />

        <RenameModal
          isOpen={welcomeRename}
          onCreate={handleCreatePollFromDraft}
          isLoading={isCreatingPoll || createPoll.isPending}
          defaultName="My poll"
          showVisibilitySelect={canManageAccess}
          title="Rename your poll"
        />

        <ActionToast
          message={toast}
          icon={
            <FloppyDisk
              size={12}
              weight="bold"
              className="text-emerald-400"
            />
          }
          bottom="bottom-6"
        />
      </div>
    </>
  );
}
