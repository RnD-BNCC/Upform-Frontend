import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ActionToast, Spinner } from "@/components/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePoll, useGetPollDetail } from "@/hooks/polls";
import {
  useMutationUpdatePoll,
  useMutationCreateSlide,
  useMutationUpdateSlide,
  useMutationDeleteSlide,
  useMutationReorderSlides,
  useQueryPollScores,
} from "@/api/polls";
import { QUERY_KEYS } from "@/api/queryKeys";
import { apiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import {
  ConfirmModal,
  LoadingModal,
  StatusModal,
  type StatusType,
} from "@/components/modal";
import type {
  LeaderboardEntry,
  PollSlide,
  SlideType,
  SlideSettings,
} from "@/types/polling";
import type { Poll } from "@/types/polling";
import {
  SlidePreview,
  SettingsPanel,
  SlidesSidebar,
  PollThemePickerModal,
} from "./components";
import { RenameModal } from "@/components/ui";
import { THEME_PRESETS, type ThemePreset } from "@/config/polling";
import {
  DesktopIcon,
  FloppyDisk,
  Presentation,
  ArrowClockwise,
  Trophy,
} from "@phosphor-icons/react";

type PollEditorRouteState = {
  poll?: Poll;
  selectedIndex?: number;
  isNewDraft?: boolean;
};

const RANK_BADGES = [
  "bg-amber-400 text-amber-950",
  "bg-slate-300 text-slate-900",
  "bg-orange-300 text-orange-950",
];

function getRankBadgeClass(rank: number) {
  return RANK_BADGES[rank - 1] ?? "bg-gray-100 text-gray-500";
}

const DEFAULT_POLL_THEME =
  THEME_PRESETS.find((theme) => theme.id === "upform-light") ??
  THEME_PRESETS[0];

function getThemeSlideSettings(theme: ThemePreset): SlideSettings {
  return {
    bgColor: theme.bgColor,
    barColors: theme.barColors,
    showInstructionsBar: true,
    showQrCode: true,
    textColor: theme.textColor,
  };
}

function createLocalSlide(theme: ThemePreset, pollId = "new"): PollSlide {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    pollId,
    order: 0,
    type: "multiple_choice",
    question: "Multiple choice",
    options: ["Option 1", "Option 2"],
    settings: getThemeSlideSettings(theme),
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}

function createLocalPoll(theme: ThemePreset): Poll {
  const now = new Date().toISOString();

  return {
    id: "new",
    title: "Untitled Poll",
    code: "DRAFT",
    status: "waiting",
    currentSlide: 0,
    slides: [createLocalSlide(theme)],
    createdAt: now,
    updatedAt: now,
  };
}

function applyThemeToPollSlides(poll: Poll, theme: ThemePreset): Poll {
  const themeSettings = getThemeSlideSettings(theme);

  return {
    ...poll,
    slides: poll.slides.map((slide, index) =>
      index === 0
        ? {
            ...slide,
            settings: {
              ...(slide.settings ?? {}),
              ...themeSettings,
            },
          }
        : slide,
    ),
  };
}

function PollEditorLargeScreenNotice({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-3 py-6 lg:hidden">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-5 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <DesktopIcon size={24} weight="duotone" />
        </div>
        <h1 className="text-base font-bold text-gray-950">
          The UpForm poll editor works best on larger screens
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Polls you create will still work for participants on mobile devices.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-full items-center justify-center rounded-sm bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Back to polls
          </button>
        </div>
      </div>
    </div>
  );
}

function useSlideState(
  slide: PollSlide,
  pollId: string,
  onSaved?: () => void,
) {
  const updateSlide = useMutationUpdateSlide(pollId);

  const [question, setQuestionState] = useState(slide.question);
  const [type, setTypeState] = useState<SlideType>(slide.type as SlideType);
  const [options, setOptionsState] = useState<string[]>(slide.options ?? []);
  const [settings, setSettingsState] = useState<SlideSettings>(
    (slide.settings as SlideSettings) ?? {},
  );

  const pendingRef = useRef({ question, type, options, settings });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = slide.question;
      const t = slide.type as SlideType;
      const o = slide.options ?? [];
      const s = (slide.settings as SlideSettings) ?? {};
      pendingRef.current = { question: q, type: t, options: o, settings: s };
      setQuestionState(q);
      setTypeState(t);
      setOptionsState(o);
      setSettingsState(s);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [slide.id, slide.options, slide.question, slide.settings, slide.type]);

  const setQuestion = useCallback((q: string) => {
    pendingRef.current.question = q;
    setQuestionState(q);
  }, []);

  const setOptions = useCallback((o: string[]) => {
    pendingRef.current.options = o;
    setOptionsState(o);
  }, []);

  const setSettings = useCallback((s: SlideSettings) => {
    pendingRef.current.settings = s;
    setSettingsState(s);
  }, []);

  const doSave = useCallback(
    (
      overrides?: Partial<{
        question: string;
        type: SlideType;
        options: string[];
        settings: SlideSettings;
      }>,
    ) => {
      updateSlide.mutate(
        {
          slideId: slide.id,
          question: overrides?.question ?? pendingRef.current.question,
          type: overrides?.type ?? pendingRef.current.type,
          options: overrides?.options ?? pendingRef.current.options,
          settings: overrides?.settings ?? pendingRef.current.settings,
        },
        { onSuccess: () => onSaved?.() },
      );
    },
    [slide.id, updateSlide, onSaved],
  );

  const handleTypeChange = (newType: SlideType) => {
    pendingRef.current.type = newType;
    setTypeState(newType);
    doSave({ type: newType });
  };

  return {
    question,
    setQuestion,
    type,
    setType: handleTypeChange,
    options,
    setOptions,
    settings,
    setSettings,
    doSave,
  };
}

export default function PollEditPage() {
  const { id: pollId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const routeState = location.state as PollEditorRouteState | null;
  const isLocalNewPoll = pollId === "new";
  const persistedPollId = isLocalNewPoll ? "" : (pollId ?? "");
  const routePoll = !isLocalNewPoll ? routeState?.poll : undefined;
  const [localPoll, setLocalPoll] = useState<Poll | null>(() =>
    isLocalNewPoll ? createLocalPoll(DEFAULT_POLL_THEME) : (routePoll ?? null),
  );
  const { data: fetchedPoll, isLoading } = useGetPollDetail(persistedPollId);
  const poll = localPoll ?? fetchedPoll ?? routePoll;
  const createPoll = useCreatePoll();
  const updatePoll = useMutationUpdatePoll();
  const createSlide = useMutationCreateSlide(persistedPollId);
  const deleteSlide = useMutationDeleteSlide(persistedPollId);
  const reorderSlides = useMutationReorderSlides(persistedPollId);

  const [selectedIndex, setSelectedIndex] = useState(
    routeState?.selectedIndex ?? 0,
  );
  const [activePanel, setActivePanel] = useState<"edit" | "results">("edit");
  const [title, setTitle] = useState(poll?.title ?? "");
  const [titleInit, setTitleInit] = useState(Boolean(poll));
  const [welcomeThemePicker, setWelcomeThemePicker] = useState(isLocalNewPoll);
  const [welcomeRename, setWelcomeRename] = useState(false);
  const [pendingTheme, setPendingTheme] =
    useState<ThemePreset>(DEFAULT_POLL_THEME);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [liveQuestion, setLiveQuestion] = useState<string | null>(null);
  const slideSaveRef = useRef<(() => void) | null>(null);
  const saveReorderRef = useRef<(() => void) | null>(null);
  const routeIdRef = useRef(pollId);

  const showToast = useCallback((msg = "Saved successfully") => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
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
      setTitleInit(true);
      setPendingTheme(DEFAULT_POLL_THEME);
    } else {
      setLocalPoll(routeState?.poll ?? null);
      if (routeState?.poll) {
        setTitle(routeState.poll.title);
        setTitleInit(true);
      }
    }
  }, [pollId, routeState?.poll, routeState?.selectedIndex]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (persistedPollId && title) {
          updatePoll.mutate({ pollId: persistedPollId, title });
          slideSaveRef.current?.();
          saveReorderRef.current?.();
        }
        showToast();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [persistedPollId, showToast, title, updatePoll]);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [loadingModal, setLoadingModal] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    type: StatusType;
    title: string;
    description: string;
  }>({ open: false, type: "success", title: "", description: "" });

  useEffect(() => {
    if (poll && !titleInit) {
      setTitle(poll.title);
      setTitleInit(true);
    }
  }, [poll, titleInit]);

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

  const handleSaveTitle = () => {
    if (!persistedPollId) return;
    updatePoll.mutate({ pollId: persistedPollId, title });
  };

  const handleSave = () => {
    if (persistedPollId && title) {
      updatePoll.mutate({ pollId: persistedPollId, title });
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
          slides: [
            ...source.slides,
            { ...newSlide, order: source.slides.length },
          ],
        };
      });
      setSelectedIndex(slides.length);
      return;
    }

    setLoadingModal(true);
    createSlide.mutate(
      {},
      {
        onSuccess: () => {
          setLoadingModal(false);
          setSelectedIndex(slides.length);
          setStatusModal({
            open: true,
            type: "success",
            title: "Slide Added",
            description: "New slide has been created successfully.",
          });
        },
        onError: () => {
          setLoadingModal(false);
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
        setConfirmModal((s) => ({ ...s, open: false }));
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
        deleteSlide.mutate(slideId, {
          onSuccess: () => {
            setLoadingModal(false);
            if (selectedIndex >= slides.length - 1)
              setSelectedIndex(Math.max(0, slides.length - 2));
            setStatusModal({
              open: true,
              type: "success",
              title: "Deleted",
              description: "Slide has been removed successfully.",
            });
          },
          onError: () => {
            setLoadingModal(false);
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

    reorderSlides.mutate(orderedIds, {
      onSuccess: () => {
        if (selectedSlideId) {
          const newIndex = orderedIds.indexOf(selectedSlideId);
          if (newIndex !== -1) setSelectedIndex(newIndex);
        }
      },
    });
  };

  const copyCode = () => navigator.clipboard.writeText(poll.code);
  const handlePresent = () => {
    if (persistedPollId) navigate(`/polls/${persistedPollId}/present`);
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

  const handleCreatePollFromDraft = async (name: string) => {
    setIsCreatingPoll(true);
    try {
      const createdPoll = await createPoll.mutateAsync({ title: name });
      const themedPoll = await applyInitialThemeToPersistedPoll(
        createdPoll,
        pendingTheme,
      );
      setTitle(name);
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
          slides={slides}
          selectedIndex={selectedIndex}
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
          onSave={handleSave}
          onShowEdit={() => setActivePanel("edit")}
          onShowResults={() => setActivePanel("results")}
          isAddPending={createSlide.isPending}
        />

        {activePanel === "results" ? (
          <PollResultsPanel pollId={persistedPollId} title={title} />
        ) : selectedSlide ? (
          <SlideEditorBridge
            key={selectedSlide.id}
            slide={selectedSlide}
            pollId={persistedPollId}
            code={poll.code}
            saveRef={slideSaveRef}
            onSaved={showToast}
            onQuestionLive={setLiveQuestion}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-center pt-32 sm:pt-0">
            <Presentation size={48} className="text-gray-200 mb-4" />
            <p className="text-sm font-medium text-gray-400">
              No slide selected
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Choose a slide from the sidebar or create a new one
            </p>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.open}
          onClose={() => setConfirmModal((s) => ({ ...s, open: false }))}
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
          onClose={() => setStatusModal((s) => ({ ...s, open: false }))}
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
          title="Rename your poll"
        />

        <ActionToast
          message={toast}
          icon={<FloppyDisk size={12} weight="bold" className="text-emerald-400" />}
          bottom="bottom-6"
        />
      </div>
    </>
  );
}

function PollResultsPanel({
  pollId,
  title,
}: {
  pollId: string;
  title: string;
}) {
  const {
    data: scores = [],
    isFetching,
    isLoading,
    refetch,
  } = useQueryPollScores(pollId);
  const totalParticipants = scores.length;
  const topScore = scores[0]?.score ?? 0;
  const averageScore =
    totalParticipants > 0
      ? Math.round(
          scores.reduce((total, entry) => total + entry.score, 0) /
            totalParticipants,
        )
      : 0;

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500">
              Poll Results
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Leaderboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Full ranking for {title || "Untitled Poll"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              <ArrowClockwise
                size={14}
                weight="bold"
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Participants</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-gray-900">
              {totalParticipants}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Top score</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-gray-900">
              {topScore}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Average score</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-gray-900">
              {averageScore}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} weight="fill" className="text-primary-500" />
              <p className="text-sm font-bold text-gray-900">All rankings</p>
            </div>
            <p className="text-xs text-gray-400">
              {totalParticipants} participant
              {totalParticipants === 1 ? "" : "s"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Spinner size={28} className="text-primary-500" />
              <p className="text-sm text-gray-400">Loading rankings...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <Trophy size={40} className="text-gray-200" weight="duotone" />
              <p className="text-sm font-bold text-gray-500">No rankings yet</p>
              <p className="max-w-sm text-xs leading-relaxed text-gray-400">
                Rankings will appear after participants answer scored poll
                questions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scores.map((entry: LeaderboardEntry, index) => {
                const rank = index + 1;

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[56px_1fr_110px] items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${getRankBadgeClass(
                        rank,
                      )}`}
                    >
                      {rank}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {entry.name || "Anonymous"}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        ID {entry.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black tabular-nums text-gray-900">
                        {entry.score}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        points
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideEditorBridge({
  slide,
  pollId,
  code,
  saveRef,
  onSaved,
  onQuestionLive,
}: {
  slide: PollSlide;
  pollId: string;
  code: string;
  saveRef: React.MutableRefObject<(() => void) | null>;
  onSaved: () => void;
  onQuestionLive: (q: string | null) => void;
}) {
  const {
    doSave,
    options,
    question,
    setOptions,
    setQuestion,
    setSettings,
    setType,
    settings,
    type,
  } = useSlideState(slide, pollId, onSaved);

  useEffect(() => {
    saveRef.current = () => doSave();
  }, [doSave, saveRef]);

  useEffect(() => {
    onQuestionLive(question);
    return () => onQuestionLive(null);
  }, [question, onQuestionLive]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-32 sm:pt-8 flex items-start justify-center">
        <div className="w-full max-w-3xl max-h-3xl">
          <SlidePreview
            code={code}
            question={question}
            options={options}
            type={type}
            settings={settings}
            onQuestionChange={setQuestion}
            onQuestionBlur={(val) => doSave({ question: val })}
          />
        </div>
      </div>

      <SettingsPanel
        type={type}
        options={options}
        settings={settings}
        onTypeChange={setType}
        onOptionsChange={setOptions}
        onSettingsChange={setSettings}
        onBlur={() => doSave()}
      />
    </>
  );
}
