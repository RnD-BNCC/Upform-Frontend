import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useCreatePoll, useGetPollDetail } from "@/hooks/polls";
import {
  useMutationUpdatePoll,
  useMutationCreateSlide,
  useMutationUpdateSlide,
  useMutationDeleteSlide,
  useMutationReorderSlides,
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
import type { PollSlide, SlideType, SlideSettings } from "@/types/polling";
import type { Poll } from "@/types/polling";
import {
  SlidePreview,
  SettingsPanel,
  SlidesSidebar,
  PollRenameModal,
  PollThemePickerModal,
} from "./components";
import { THEME_PRESETS, type ThemePreset } from "@/config/polling";
import {
  DesktopIcon,
  FloppyDisk,
  SpinnerGap,
  Presentation,
} from "@phosphor-icons/react";

type PollEditorRouteState = {
  poll?: Poll;
  selectedIndex?: number;
  isNewDraft?: boolean;
};

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

function PollEditorLargeScreenNotice({
  onBack,
}: {
  onBack: () => void;
}) {
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

function useSlideState(slide: PollSlide, pollId: string, onSaved?: () => void) {
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
  }, [persistedPollId, title, updatePoll, showToast]);

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
          <SpinnerGap size={32} className="text-primary-500 animate-spin" />
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
      <PollEditorLargeScreenNotice
        onBack={() => navigate("/polls")}
      />
      <div
        className="hidden min-h-screen flex-col bg-gray-50 lg:flex lg:flex-row"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,84,165,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,165,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <SlidesSidebar
          title={title}
          pollCode={poll.code}
          slides={slides}
          selectedIndex={selectedIndex}
          liveQuestion={liveQuestion}
          onBack={() => navigate("/polls")}
          onTitleChange={setTitle}
          onTitleBlur={handleSaveTitle}
          onSelectSlide={setSelectedIndex}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onReorderSlides={handleReorderSlides}
          saveReorderRef={saveReorderRef}
          onCopyCode={copyCode}
          onPresent={() => {
            if (persistedPollId) navigate(`/polls/${persistedPollId}/present`);
          }}
          onSave={handleSave}
          isAddPending={createSlide.isPending}
        />

        {selectedSlide ? (
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

        <PollRenameModal
          isOpen={welcomeRename}
          onCreate={handleCreatePollFromDraft}
          isLoading={isCreatingPoll || createPoll.isPending}
        />

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
            >
              <FloppyDisk
                size={12}
                weight="bold"
                className="text-emerald-400"
              />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
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
