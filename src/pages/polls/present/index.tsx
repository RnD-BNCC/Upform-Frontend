import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  useGetPollDetail,
  useSocket,
  useLiveResults,
  useLiveSlide,
} from "@/hooks/polls";
import { useMutationUpdatePoll, useQuerySlideResults } from "@/api/polls";
import { useQueryClient } from "@tanstack/react-query";
import { useQAQuestions } from "@/api/questions";
import { useQASocket } from "@/hooks";
import { apiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import { Leaderboard } from "@/components/polling";
import type {
  SlideSettings,
  ImageLayout,
  PollStatus,
  QAResult,
  QAQuestion,
  SlideResults,
} from "@/types/polling";
import { publicApiClient } from "@/config/api-client";
import { SpinnerGap } from "@phosphor-icons/react";
import {
  CountdownOverlay,
  BlankScreenOverlay,
  HotkeysModal,
  JoinOverlay,
  QAPresenterModal,
  RestartingOverlay,
  SlideGridModal,
  PresentHeader,
  WaitingRoomView,
  SlidePresenter,
  PresentControls,
} from "./components";

export default function PollPresentPage() {
  const { id: pollId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: poll, isLoading, refetch } = useGetPollDetail(pollId ?? "");
  const updatePoll = useMutationUpdatePoll();
  const { socketRef, connected } = useSocket(pollId);
  const { participantCount, participantList, leaderboardScores } = useLiveSlide(
    socketRef,
    connected,
  );

  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);
  const { data: initialQuestions } = useQAQuestions(pollId);
  useEffect(() => {
    if (initialQuestions) setQaQuestions(initialQuestions);
  }, [initialQuestions]);
  useQASocket({
    socketRef,
    pollId,
    myUserId: "presenter",
    questions: qaQuestions,
    onQuestionsChange: setQaQuestions,
  });

  const [ready, setReady] = useState(false);
  useEffect(() => {
    refetch().finally(() => setReady(true));
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showJoinOverlay, setShowJoinOverlay] = useState(false);
  const [showSlideGrid, setShowSlideGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [hideResponses, setHideResponses] = useState(false);
  const [showBlankScreen, setShowBlankScreen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [statusOverride, setStatusOverride] = useState<PollStatus | null>(null);
  const [revealPhase, setRevealPhase] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerPopover, setShowTimerPopover] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showQASidebar, setShowQASidebar] = useState(false);
  const [qaHighlightedVoteId, setQaHighlightedVoteId] = useState<string | null>(
    null,
  );
  const [optimisticAnswered, setOptimisticAnswered] = useState<Set<string>>(
    new Set(),
  );
  const [optimisticRestored, setOptimisticRestored] = useState<Set<string>>(
    new Set(),
  );
  const qaStateRef = useRef({
    showQASidebar: false,
    qaHighlightedVoteId: null as string | null,
    unansweredQA: [] as QAResult,
    allQA: [] as QAResult,
    pollId: "" as string | undefined,
    activeSlideId: "" as string | undefined,
    isQASlide: false,
  });

  const slideInitRef = useRef(false);
  useEffect(() => {
    if (poll && !slideInitRef.current) {
      setCurrentSlide(poll.currentSlide);
      slideInitRef.current = true;
    }
  }, [poll?.currentSlide]);

  useEffect(() => {
    setRevealPhase(false);
  }, [currentSlide]);

  const slides = poll?.slides ?? [];
  const activeSlide = slides[currentSlide];
  const slideSettings = (activeSlide?.settings as SlideSettings) ?? {};
  const isQASlide = activeSlide?.type === "qa";

  const { results: liveResults, setResults: setLiveResults } = useLiveResults(
    socketRef,
    activeSlide?.id,
    connected,
  );
  const { data: fetchedResults } = useQuerySlideResults(
    pollId ?? "",
    activeSlide?.id ?? "",
  );
  const displayResults = liveResults ?? fetchedResults ?? null;

  const qaResultsRaw =
    isQASlide && displayResults ? (displayResults as QAResult) : null;
  const qaResults = useMemo(() => {
    if (!isQASlide) return null;
    if (qaResultsRaw && qaResultsRaw.length > 0) {
      const likeMap = new Map(qaQuestions.map((q) => [q.text, q.likeCount]));
      return qaResultsRaw.map((r) => ({
        ...r,
        likeCount: likeMap.get(r.text) ?? 0,
      }));
    }
    if (qaQuestions.length > 0) {
      return qaQuestions.map((q) => ({
        text: q.text,
        participantName: q.authorName,
        createdAt: q.createdAt,
        likeCount: q.likeCount,
        isAnswered: false,
        voteId: q.pollVoteId ?? q.id,
      })) as QAResult;
    }
    return null;
  }, [isQASlide, qaResultsRaw, qaQuestions]);

  const mergedQaResults = useMemo(() => {
    if (
      !qaResults ||
      (optimisticAnswered.size === 0 && optimisticRestored.size === 0)
    )
      return qaResults;
    return qaResults.map((q) => {
      if (!q.voteId) return q;
      if (optimisticAnswered.has(q.voteId)) return { ...q, isAnswered: true };
      if (optimisticRestored.has(q.voteId)) return { ...q, isAnswered: false };
      return q;
    });
  }, [qaResults, optimisticAnswered, optimisticRestored]);

  useEffect(() => {
    if (!qaResults) return;
    if (optimisticAnswered.size > 0) {
      const confirmed = qaResults
        .filter(
          (q) => q.isAnswered && q.voteId && optimisticAnswered.has(q.voteId),
        )
        .map((q) => q.voteId!);
      if (confirmed.length > 0)
        setOptimisticAnswered((prev) => {
          const n = new Set(prev);
          confirmed.forEach((id) => n.delete(id));
          return n;
        });
    }
    if (optimisticRestored.size > 0) {
      const confirmed = qaResults
        .filter(
          (q) => !q.isAnswered && q.voteId && optimisticRestored.has(q.voteId),
        )
        .map((q) => q.voteId!);
      if (confirmed.length > 0)
        setOptimisticRestored((prev) => {
          const n = new Set(prev);
          confirmed.forEach((id) => n.delete(id));
          return n;
        });
    }
  }, [qaResults]);

  const unansweredQA = mergedQaResults?.filter((q) => !q.isAnswered) ?? [];
  const answeredQA = mergedQaResults?.filter((q) => q.isAnswered) ?? [];
  const allQA = useMemo(() => {
    const sorted = [...unansweredQA].sort(
      (a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0),
    );
    return [...sorted, ...answeredQA];
  }, [unansweredQA, answeredQA]);
  const effectiveResults =
    isQASlide && mergedQaResults ? mergedQaResults : displayResults;

  qaStateRef.current = {
    showQASidebar,
    qaHighlightedVoteId,
    unansweredQA,
    allQA,
    pollId,
    activeSlideId: activeSlide?.id,
    isQASlide,
  };

  useEffect(() => {
    if (!isQASlide) setShowQASidebar(false);
    setQaHighlightedVoteId(null);
  }, [activeSlide?.id, isQASlide]);

  useEffect(() => {
    if (!qaHighlightedVoteId) return;
    const stillUnAnswered = unansweredQA.find(
      (q) => q.voteId === qaHighlightedVoteId,
    );
    if (!stillUnAnswered && unansweredQA.length > 0) {
      setQaHighlightedVoteId(unansweredQA[0].voteId ?? null);
    }
  }, [unansweredQA]);

  const handleMarkQAAnswered = useCallback(
    async (voteId: string) => {
      if (!pollId || !activeSlide) return;
      const isCurrentlyAnswered = mergedQaResults?.find(
        (q) => q.voteId === voteId,
      )?.isAnswered;
      if (isCurrentlyAnswered) {
        setOptimisticRestored((prev) => new Set(prev).add(voteId));
      } else {
        setOptimisticAnswered((prev) => new Set(prev).add(voteId));
      }
      try {
        await publicApiClient.patch(
          Api.publicPollVoteAnswer(pollId, activeSlide.id, voteId),
        );
      } catch (err) {
        console.error("[handleMarkQAAnswered]", err);
        if (isCurrentlyAnswered) {
          setOptimisticRestored((prev) => {
            const n = new Set(prev);
            n.delete(voteId);
            return n;
          });
        } else {
          setOptimisticAnswered((prev) => {
            const n = new Set(prev);
            n.delete(voteId);
            return n;
          });
        }
      }
    },
    [pollId, activeSlide, mergedQaResults],
  );

  const handleQANext = useCallback(() => {
    const { allQA: list, qaHighlightedVoteId: hlId } = qaStateRef.current;
    if (list.length === 0) return;
    const idx = list.findIndex((q) => q.voteId === hlId);
    const newIdx = idx < 0 || idx >= list.length - 1 ? 0 : idx + 1;
    setQaHighlightedVoteId(list[newIdx]?.voteId ?? null);
  }, []);

  const handleQAPrev = useCallback(() => {
    const { allQA: list, qaHighlightedVoteId: hlId } = qaStateRef.current;
    if (list.length === 0) return;
    const idx = list.findIndex((q) => q.voteId === hlId);
    const newIdx = idx <= 0 ? list.length - 1 : idx - 1;
    setQaHighlightedVoteId(list[newIdx]?.voteId ?? null);
  }, []);

  const effectiveStatus = statusOverride ?? poll?.status;
  const isWaitingRoom = effectiveStatus === "waiting";
  const isLeaderboardSlide = currentSlide === slides.length;
  const isLastQuestionSlide =
    currentSlide >= slides.length - 1 && !isLeaderboardSlide;
  const isFirstSlide = currentSlide <= 0;

  const goToSlide = useCallback(
    (index: number) => {
      if (!pollId) return;
      const isLeaderboard = index === slides.length;
      setRevealPhase(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerActive(false);
      setTimerRemaining(null);
      socketRef.current?.emit("timer-stop", { pollId });
      setCurrentSlide(index);
      setShowSlideGrid(false);

      if (isLeaderboard) {
        updatePoll.mutate({ pollId, currentSlide: index });
        socketRef.current?.emit("broadcast-poll-state", {
          pollId,
          currentSlide: index,
        });
        socketRef.current?.emit("broadcast-leaderboard", { pollId });
      } else {
        setStatusOverride("waiting");
        updatePoll.mutate({ pollId, currentSlide: index, status: "waiting" });
        socketRef.current?.emit("broadcast-poll-state", {
          pollId,
          currentSlide: index,
          status: "waiting",
        });
        socketRef.current?.emit("hide-leaderboard", { pollId });
      }
    },
    [pollId, slides.length, updatePoll, socketRef],
  );

  useEffect(() => {
    if (countdown === null) return;
    if (pollId)
      socketRef.current?.emit("broadcast-countdown", {
        pollId,
        count: countdown,
      });
    if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
        setStatusOverride("active");
        if (pollId) {
          updatePoll.mutate({ pollId, status: "active" });
          socketRef.current?.emit("broadcast-poll-state", {
            pollId,
            status: "active",
          });
        }
        const settings =
          (slides[currentSlide]?.settings as SlideSettings) ?? {};
        if (settings.timer && settings.timer > 0) {
          const startedAt = Date.now();
          if (pollId)
            socketRef.current?.emit("timer-start", {
              pollId,
              duration: settings.timer,
              startedAt,
            });
          setTimerRemaining(settings.timer);
          setTimerActive(true);
          timerIntervalRef.current = setInterval(() => {
            setTimerRemaining((prev) => {
              if (prev === null || prev <= 1) return 0;
              return prev - 1;
            });
          }, 1000);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, pollId, updatePoll, socketRef]);

  const handleStartQuiz = useCallback(() => {
    setCountdown(5);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerActive(false);
    setTimerRemaining(null);
    if (pollId) socketRef.current?.emit("timer-stop", { pollId });
  }, [pollId, socketRef]);

  const startTimer = useCallback(
    (seconds: number) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const startedAt = Date.now();
      if (pollId)
        socketRef.current?.emit("timer-start", {
          pollId,
          duration: seconds,
          startedAt,
        });
      setTimerRemaining(seconds);
      setTimerActive(true);
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev === null || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    },
    [pollId, socketRef],
  );

  useEffect(() => {
    if (timerRemaining !== 0 || !timerActive) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerActive(false);
    if (
      (activeSlide?.type === "multiple_choice" && slideSettings.correctAnswer) ||
      (activeSlide?.type === "guess_number" && slideSettings.correctNumber !== undefined) ||
      (activeSlide?.type === "word_cloud" && slideSettings.correctAnswers?.length) ||
      (activeSlide?.type === "pin_on_image" && slideSettings.correctArea)
    ) {
      setRevealPhase(true);
      socketRef.current?.emit("broadcast-reveal-answer", { pollId });
    } else if (activeSlide?.type !== "scales" && activeSlide?.type !== "qa") {
      if (isLastQuestionSlide) goToSlide(slides.length);
      else goToSlide(currentSlide + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRemaining, timerActive]);

  const handleRestart = useCallback(async () => {
    if (!pollId || restarting) return;
    setRestarting(true);
    try {
      await Promise.all([
        apiClient.delete(Api.pollVotes(pollId)),
        apiClient.delete(Api.pollQuestions(pollId)),
      ]);
    } catch (err) {
      console.error("[handleRestart]", err);
    }
    updatePoll.mutate(
      { pollId, status: "waiting", currentSlide: 0 },
      { onSettled: () => setRestarting(false) },
    );
    socketRef.current?.emit("broadcast-poll-state", {
      pollId,
      status: "waiting",
      currentSlide: 0,
    });
    socketRef.current?.emit("reset-scores", { pollId });
    setLiveResults(null);
    queryClient.invalidateQueries({ queryKey: ["slide-results"] });
    setCurrentSlide(0);
    setCountdown(null);
    setRevealPhase(false);
    setStatusOverride("waiting");
    setQaQuestions([]);
    setOptimisticAnswered(new Set());
    setOptimisticRestored(new Set());
  }, [pollId, restarting, updatePoll, socketRef, setLiveResults, queryClient]);

  const handleEnd = useCallback(() => {
    if (!pollId) return;
    socketRef.current?.emit("broadcast-poll-state", {
      pollId,
      status: "ended",
    });
    updatePoll.mutate({ pollId, status: "ended", currentSlide: 0 });
    navigate("/polls");
  }, [pollId, updatePoll, navigate, socketRef]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!showTimerPopover) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-timer-popover]")) setShowTimerPopover(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTimerPopover]);

  const handlePrimaryAction = useCallback(() => {
    if (isLeaderboardSlide) {
      handleEnd();
    } else if (isWaitingRoom) {
      handleStartQuiz();
    } else if (revealPhase) {
      if (isLastQuestionSlide) goToSlide(slides.length);
      else goToSlide(currentSlide + 1);
    } else if (
      (activeSlide?.type === "multiple_choice" && slideSettings.correctAnswer) ||
      (activeSlide?.type === "guess_number" && slideSettings.correctNumber !== undefined) ||
      (activeSlide?.type === "word_cloud" && slideSettings.correctAnswers?.length) ||
      (activeSlide?.type === "pin_on_image" && slideSettings.correctArea)
    ) {
      stopTimer();
      setRevealPhase(true);
      socketRef.current?.emit("broadcast-reveal-answer", { pollId });
    } else if (isLastQuestionSlide) {
      goToSlide(slides.length);
    } else {
      goToSlide(currentSlide + 1);
    }
  }, [
    isLeaderboardSlide,
    isWaitingRoom,
    revealPhase,
    isLastQuestionSlide,
    activeSlide,
    slideSettings,
    handleEnd,
    handleStartQuiz,
    goToSlide,
    stopTimer,
    slides.length,
    currentSlide,
    pollId,
    socketRef,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const {
        showQASidebar: qaSidebarOpen,
        qaHighlightedVoteId: qaHlId,
        allQA: qaList,
        unansweredQA: qaUnanswered,
        pollId: qaPollId,
        activeSlideId: qaSlideId,
      } = qaStateRef.current;

      switch (e.key) {
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "ArrowRight":
          if (isLeaderboardSlide) break;
          if (isWaitingRoom && countdown === null) {
            handleStartQuiz();
            break;
          }
          if (revealPhase) {
            if (isLastQuestionSlide) goToSlide(slides.length);
            else goToSlide(currentSlide + 1);
            break;
          }
          if (
            !isWaitingRoom &&
            ((activeSlide?.type === "multiple_choice" && slideSettings.correctAnswer) ||
              (activeSlide?.type === "guess_number" && slideSettings.correctNumber !== undefined) ||
              (activeSlide?.type === "word_cloud" && slideSettings.correctAnswers?.length) ||
              (activeSlide?.type === "pin_on_image" && slideSettings.correctArea))
          ) {
            stopTimer();
            setRevealPhase(true);
            socketRef.current?.emit("broadcast-reveal-answer", { pollId });
            break;
          }
          if (!isWaitingRoom && isLastQuestionSlide) goToSlide(slides.length);
          else if (!isWaitingRoom && currentSlide < slides.length - 1)
            goToSlide(currentSlide + 1);
          break;
        case "ArrowLeft":
          if (isLeaderboardSlide) {
            goToSlide(slides.length - 1);
            break;
          }
          if (currentSlide > 0) goToSlide(currentSlide - 1);
          break;
        case "ArrowUp":
          if (qaStateRef.current.isQASlide && qaList.length > 0) {
            e.preventDefault();
            const idx = qaList.findIndex((q) => q.voteId === qaHlId);
            const newIdx = idx <= 0 ? qaList.length - 1 : idx - 1;
            setQaHighlightedVoteId(qaList[newIdx]?.voteId ?? null);
          }
          break;
        case "ArrowDown":
          if (qaStateRef.current.isQASlide && qaList.length > 0) {
            e.preventDefault();
            const idx = qaList.findIndex((q) => q.voteId === qaHlId);
            const newIdx =
              idx < 0 || idx >= qaList.length - 1 ? 0 : idx + 1;
            setQaHighlightedVoteId(qaList[newIdx]?.voteId ?? null);
          }
          break;
        case "Enter":
          if (qaStateRef.current.isQASlide && qaPollId && qaSlideId) {
            const targetId = qaHlId ?? qaUnanswered[0]?.voteId;
            if (targetId) {
              e.preventDefault();
              setOptimisticAnswered((prev) => new Set(prev).add(targetId));
              publicApiClient
                .patch(
                  Api.publicPollVoteAnswer(qaPollId, qaSlideId, targetId),
                )
                .catch((err) => {
                  console.error("[handleEnterKey]", err);
                  setOptimisticAnswered((prev) => {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                  });
                });
            }
          }
          break;
        case "Escape":
          if (restarting) break;
          if (showHotkeys) {
            setShowHotkeys(false);
            break;
          }
          if (showSlideGrid) {
            setShowSlideGrid(false);
            break;
          }
          if (showBlankScreen) {
            setShowBlankScreen(false);
            break;
          }
          if (qaSidebarOpen) {
            setShowQASidebar(false);
            break;
          }
          navigate("/polls");
          break;
        case "s":
        case "S":
          if (isWaitingRoom && countdown === null) handleStartQuiz();
          break;
        case "r":
        case "R":
          handleRestart();
          break;
        case "p":
        case "P":
          navigate("/polls");
          break;
        case "b":
        case "B":
          setShowBlankScreen((p) => !p);
          break;
        case "h":
        case "H":
          setHideResponses((p) => !p);
          break;
        case "l":
        case "L":
          setShowJoinOverlay((p) => !p);
          break;
        case "q":
        case "Q":
          if (isQASlide) setShowQASidebar((p) => !p);
          break;
        case "t":
        case "T":
          if (isLastQuestionSlide && !isWaitingRoom) goToSlide(slides.length);
          break;
        case "?":
          setShowHotkeys((p) => !p);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    toggleFullscreen,
    currentSlide,
    slides.length,
    goToSlide,
    showSlideGrid,
    showHotkeys,
    showBlankScreen,
    restarting,
    handleRestart,
    handleStartQuiz,
    isWaitingRoom,
    isLastQuestionSlide,
    isLeaderboardSlide,
    countdown,
    navigate,
    isQASlide,
    revealPhase,
    stopTimer,
    slideSettings,
    activeSlide,
  ]);

  if (!ready || isLoading || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SpinnerGap size={32} className="text-primary-500 animate-spin" />
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/live`;
  const bgColor = slideSettings.bgColor ?? "#FFFFFF";
  const textColor = slideSettings.textColor ?? "#111827";
  const imageUrl = slideSettings.imageUrl;
  const imageLayout: ImageLayout = slideSettings.imageLayout ?? "above";

  return (
    <div
      className="h-dvh flex flex-col relative overflow-hidden"
      style={{ backgroundColor: isLeaderboardSlide ? "#001d3a" : bgColor }}
    >
      <CountdownOverlay countdown={countdown} />

      {showBlankScreen && (
        <BlankScreenOverlay onClose={() => setShowBlankScreen(false)} />
      )}

      {imageUrl && imageLayout === "full" && !isLeaderboardSlide && (
        <div className="absolute inset-0 z-0">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      )}

      {!isLeaderboardSlide && (
        <PresentHeader
          title={poll.title}
          code={poll.code}
          currentSlide={currentSlide}
          totalSlides={slides.length}
          participantCount={participantCount}
          joinUrl={joinUrl}
          textColor={textColor}
          showInstructionsBar={slideSettings.showInstructionsBar !== false}
        />
      )}

      {isLeaderboardSlide ? (
        <div className="flex-1 flex">
          <Leaderboard scores={leaderboardScores} />
        </div>
      ) : isWaitingRoom ? (
        <WaitingRoomView
          imageUrl={imageUrl}
          imageLayout={imageLayout}
          currentSlide={currentSlide}
          totalSlides={slides.length}
          participants={participantList}
          textColor={textColor}
        />
      ) : (
        activeSlide && (
          <SlidePresenter
            activeSlide={activeSlide}
            imageUrl={imageUrl}
            imageLayout={imageLayout}
            hideResponses={hideResponses}
            textColor={textColor}
            bgColor={bgColor}
            effectiveResults={effectiveResults as SlideResults | null}
            slideSettings={slideSettings}
            qaHighlightedVoteId={qaHighlightedVoteId}
            revealPhase={revealPhase}
            onQANext={handleQANext}
            onQAPrev={handleQAPrev}
            onMarkQAAnswered={handleMarkQAAnswered}
          />
        )
      )}

      <JoinOverlay
        open={showJoinOverlay}
        onClose={() => setShowJoinOverlay(false)}
        joinUrl={joinUrl}
        code={poll.code}
        showQrCode={slideSettings.showQrCode !== false}
      />

      <SlideGridModal
        open={showSlideGrid}
        onClose={() => setShowSlideGrid(false)}
        slides={slides}
        currentSlide={currentSlide}
        onGoToSlide={goToSlide}
      />

      <HotkeysModal open={showHotkeys} onClose={() => setShowHotkeys(false)} />

      <AnimatePresence>
        {isQASlide && showQASidebar && (
          <QAPresenterModal
            unansweredQA={unansweredQA}
            answeredQA={answeredQA}
            highlightedVoteId={qaHighlightedVoteId}
            onHighlight={setQaHighlightedVoteId}
            onMarkAnswered={handleMarkQAAnswered}
            onNext={handleQANext}
            onPrev={handleQAPrev}
            onClose={() => setShowQASidebar(false)}
            bgColor={bgColor}
            textColor={textColor}
          />
        )}
      </AnimatePresence>

      <RestartingOverlay restarting={restarting} />

      <PresentControls
        currentSlide={currentSlide}
        totalSlides={slides.length}
        isLeaderboardSlide={isLeaderboardSlide}
        isFirstSlide={isFirstSlide}
        isWaitingRoom={isWaitingRoom}
        isLastQuestionSlide={isLastQuestionSlide}
        isQASlide={isQASlide}
        isFullscreen={isFullscreen}
        showQASidebar={showQASidebar}
        showJoinOverlay={showJoinOverlay}
        hideResponses={hideResponses}
        showSlideGrid={showSlideGrid}
        timerActive={timerActive}
        timerRemaining={timerRemaining}
        showTimerPopover={showTimerPopover}
        revealPhase={revealPhase}
        slideType={activeSlide?.type}
        slideSettings={slideSettings}
        onPrev={() =>
          isLeaderboardSlide
            ? goToSlide(slides.length - 1)
            : goToSlide(currentSlide - 1)
        }
        onPrimaryAction={handlePrimaryAction}
        onEnd={handleEnd}
        onRestart={handleRestart}
        onToggleFullscreen={toggleFullscreen}
        onToggleQASidebar={() => setShowQASidebar((p) => !p)}
        onToggleJoinOverlay={() => setShowJoinOverlay((p) => !p)}
        onToggleHideResponses={() => setHideResponses((p) => !p)}
        onToggleSlideGrid={() => setShowSlideGrid((p) => !p)}
        onShowHotkeys={() => setShowHotkeys(true)}
        onSetShowTimerPopover={setShowTimerPopover}
        onStopTimer={stopTimer}
        onStartTimer={startTimer}
      />
    </div>
  );
}
