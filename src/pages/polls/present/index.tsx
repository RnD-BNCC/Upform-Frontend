import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  useGetPollDetail,
  useSocket,
  useLiveResults,
  useLiveSlide,
} from "@/hooks/polls";
import { useMutationUpdatePoll, useQuerySlideResults } from "@/api/polls";
import { useQAQuestions } from "@/api/questions";
import { useQASocket } from "@/hooks/useQASocket";
import { apiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import SlideVisualization from "@/components/polling/visualizations";
import Leaderboard from "@/components/polling/Leaderboard";
import QAPresenterModal from "./components/QAPresenterModal";
import type {
  SlideType,
  SlideSettings,
  ImageLayout,
  Participant,
  PollStatus,
  QAResult,
  QAQuestion,
} from "@/types/polling";
import { publicApiClient } from "@/config/api-client";
import {
  CaretLeft,
  ArrowRight,
  Users,
  X,
  QrCode,
  SpinnerGap,
  ArrowsOut,
  ArrowsIn,
  Lightbulb,
  EyeSlash,
  Eye,
  Keyboard,
  ArrowsClockwise,
  Trophy,
  ChatTeardropText,
} from "@phosphor-icons/react";

const PASTEL_COLORS = [
  "#FDE68A",
  "#A7F3D0",
  "#BFDBFE",
  "#C4B5FD",
  "#FBCFE8",
  "#FCA5A5",
  "#FED7AA",
  "#D9F99D",
  "#A5F3FC",
  "#E9D5FF",
];

export default function PollPresentPage() {
  const { id: pollId } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (poll) setCurrentSlide(poll.currentSlide);
  }, [poll?.currentSlide]);

  const slides = poll?.slides ?? [];
  const activeSlide = slides[currentSlide];
  const slideSettings = (activeSlide?.settings as SlideSettings) ?? {};
  const isQASlide = activeSlide?.type === "qa";

  const { results: liveResults } = useLiveResults(
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
      }, 800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, pollId, updatePoll, socketRef]);

  const handleStartQuiz = useCallback(() => {
    setCountdown(5);
  }, []);

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
    setCurrentSlide(0);
    setCountdown(null);
    setStatusOverride("waiting");
    setQaQuestions([]);
    setOptimisticAnswered(new Set());
    setOptimisticRestored(new Set());
  }, [pollId, restarting, updatePoll, socketRef]);

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
          if (isWaitingRoom && countdown === null) handleStartQuiz();
          else if (!isWaitingRoom && isLastQuestionSlide)
            goToSlide(slides.length);
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
            const newIdx = idx < 0 || idx >= qaList.length - 1 ? 0 : idx + 1;
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
                .patch(Api.publicPollVoteAnswer(qaPollId, qaSlideId, targetId))
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
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 z-[70] bg-primary-800 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={countdown}
                initial={{ scale: 2.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-[120px] font-black text-white select-none"
              >
                {countdown === 0 ? "GO!" : countdown}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {showBlankScreen && (
        <div
          className="absolute inset-0 z-[60] bg-black flex items-center justify-center cursor-pointer"
          onClick={() => setShowBlankScreen(false)}
        >
          <p className="text-white/20 text-sm">Press B or click to resume</p>
        </div>
      )}

      {!isLeaderboardSlide && (
        <div className="flex items-center justify-between px-5 py-3 z-10 relative">
          <div className="flex items-center gap-3">
            <h1
              className="text-sm font-bold truncate max-w-48 opacity-60"
              style={{ color: textColor }}
            >
              {poll.title || "Untitled Poll"}
            </h1>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full opacity-50"
              style={{
                color: textColor,
                backgroundColor:
                  textColor === "#FFFFFF"
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.06)",
              }}
            >
              {`${currentSlide + 1}/${slides.length}`}
            </span>
            <div
              className="flex items-center gap-1 opacity-50"
              style={{ color: textColor }}
            >
              <Users size={13} weight="bold" />
              <span className="text-[11px] font-semibold tabular-nums">
                {participantCount}
              </span>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 top-3">
            <div className="flex items-center gap-1 text-[9px] font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              <span>
                Join at{" "}
                <span className="font-semibold text-gray-700">{joinUrl}</span>
              </span>
              <span className="text-gray-300">|</span>
              <span>use code</span>
              <span className="text-gray-900 font-bold tracking-wider text-[10px]">
                {poll.code}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-bold italic text-primary-500">
            UpForm
          </span>
        </div>
      )}

      {isLeaderboardSlide ? (
        <div className="flex-1 flex">
          <Leaderboard scores={leaderboardScores} />
        </div>
      ) : isWaitingRoom ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 relative">
          <p
            className="text-base font-medium opacity-50 mb-2"
            style={{ color: textColor }}
          >
            Question{" "}
            <span className="text-2xl font-black">{currentSlide + 1}</span> of{" "}
            <span className="text-2xl font-black">{slides.length}</span>
          </p>
          <FloatingAvatars participants={participantList} />
          <p className="text-sm font-bold mt-4" style={{ color: textColor }}>
            {participantList.length} player
            {participantList.length !== 1 ? "s" : ""} ready!
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 relative">
          {imageUrl && imageLayout === "full" && (
            <div className="absolute inset-0 z-0">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-cover opacity-30"
              />
            </div>
          )}

          <div className="relative z-[1] w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
            {imageUrl && imageLayout === "above" && (
              <div className="flex justify-center mb-6">
                <div className="max-h-56 max-w-full overflow-hidden rounded-xl">
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>
            )}

            {imageUrl &&
            ["left", "right", "left-large", "right-large"].includes(
              imageLayout,
            ) ? (
              <div
                className={`flex gap-8 w-full flex-1 items-center ${imageLayout === "right" || imageLayout === "right-large" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`${imageLayout.includes("large") ? "w-3/5" : "w-2/5"} shrink-0 flex items-center`}
                >
                  <div className="w-full max-h-80 overflow-hidden rounded-xl">
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-center mb-8 w-full">
                    <h2
                      className="text-3xl sm:text-4xl font-bold"
                      style={{ color: textColor }}
                      dangerouslySetInnerHTML={{
                        __html: activeSlide?.question || "No question",
                      }}
                    />
                  </div>
                  {!hideResponses && (
                    <div className="w-full flex-1 flex items-center justify-center">
                      {activeSlide && (
                        <SlideVisualization
                          type={activeSlide.type as SlideType}
                          results={effectiveResults}
                          textColor={textColor}
                          bgColor={bgColor}
                          correctAnswer={slideSettings.correctAnswer}
                          correctNumber={slideSettings.correctNumber}
                          highlightedVoteId={qaHighlightedVoteId}
                          settings={slideSettings}
                          onQANext={handleQANext}
                          onQAPrev={handleQAPrev}
                          onMarkQAAnswered={handleMarkQAAnswered}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4 w-full">
                  <h2
                    className="text-3xl sm:text-4xl font-bold"
                    style={{ color: textColor }}
                    dangerouslySetInnerHTML={{
                      __html: activeSlide?.question || "No question",
                    }}
                  />
                </div>
                <p
                  className="text-sm font-medium opacity-40 mb-6"
                  style={{ color: textColor }}
                >
                  Look at your device
                </p>
                {!hideResponses ? (
                  <div className="w-full max-w-4xl flex-1 flex items-center justify-center">
                    {activeSlide && (
                      <SlideVisualization
                        type={activeSlide.type as SlideType}
                        results={effectiveResults}
                        textColor={textColor}
                        bgColor={bgColor}
                        correctAnswer={slideSettings.correctAnswer}
                        correctNumber={slideSettings.correctNumber}
                        highlightedVoteId={qaHighlightedVoteId}
                        settings={slideSettings}
                        onQANext={handleQANext}
                        onQAPrev={handleQAPrev}
                        onMarkQAAnswered={handleMarkQAAnswered}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p
                      className="text-lg font-medium opacity-30"
                      style={{ color: textColor }}
                    >
                      Responses hidden
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showJoinOverlay && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-5 z-30 bg-white rounded-xl shadow-2xl p-5 text-center min-w-60"
          >
            <button
              onClick={() => setShowJoinOverlay(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
            <p className="text-xs text-gray-500 font-medium mb-2">Join at</p>
            <a
              href={`${joinUrl}/${poll.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-primary-600 hover:text-primary-700 mb-4 block no-underline"
            >
              {joinUrl}/{poll.code}
            </a>
            <div className="flex justify-center mb-3">
              <QRCodeSVG
                value={`${joinUrl}/${poll.code}`}
                size={140}
                level="M"
              />
            </div>
            <p className="text-2xl font-black text-gray-900 tracking-widest">
              {poll.code}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSlideGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setShowSlideGrid(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800">All Slides</h3>
                <button
                  onClick={() => setShowSlideGrid(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(i)}
                    className={`relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:shadow-md ${
                      currentSlide === i
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold ${currentSlide === i ? "text-primary-600" : "text-gray-400"}`}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug">
                      {slide.question
                        ? slide.question.replace(/<[^>]*>/g, "").slice(0, 60)
                        : "Untitled"}
                    </p>
                    <span className="text-[9px] text-gray-400 font-medium capitalize">
                      {(slide.type as string).replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HotkeysModal open={showHotkeys} onClose={() => setShowHotkeys(false)} />

      <AnimatePresence>
        {isQASlide && showQASidebar && (
          <QAPresenterModal
            unansweredQA={unansweredQA}
            answeredQA={answeredQA}
            totalCount={(qaResults ?? []).length}
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

      <AnimatePresence>
        {restarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <SpinnerGap size={40} className="text-white animate-spin" />
              <span className="text-white font-semibold text-sm">
                Restarting...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-24 z-20 flex items-end justify-center pb-5 group">
        <div className="flex items-center justify-between gap-4 bg-white rounded-full shadow-xl border border-gray-200 px-2.5 py-1.5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() =>
                isLeaderboardSlide
                  ? goToSlide(slides.length - 1)
                  : goToSlide(currentSlide - 1)
              }
              disabled={isFirstSlide && !isLeaderboardSlide}
              title="Previous slide (←)"
            >
              <CaretLeft size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowSlideGrid(!showSlideGrid)}
              title="Slide overview"
            >
              <Lightbulb size={18} weight="bold" />
            </ToolbarButton>
            <button
              onClick={() => {
                if (isLeaderboardSlide) handleEnd();
                else if (isWaitingRoom) handleStartQuiz();
                else if (isLastQuestionSlide) goToSlide(slides.length);
                else goToSlide(currentSlide + 1);
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer ml-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                isLeaderboardSlide
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : isWaitingRoom
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : isLastQuestionSlide
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {isLeaderboardSlide ? (
                <X size={14} weight="bold" />
              ) : isLastQuestionSlide && !isWaitingRoom ? (
                <Trophy size={14} weight="fill" />
              ) : (
                <ArrowRight size={14} weight="bold" />
              )}
              {isLeaderboardSlide
                ? "End poll"
                : isWaitingRoom
                  ? "Start quiz"
                  : isLastQuestionSlide
                    ? "Leaderboard"
                    : "Next slide"}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {isQASlide && (
              <ToolbarButton
                onClick={() => setShowQASidebar(!showQASidebar)}
                active={showQASidebar}
                title="Q&A sidebar (Q)"
              >
                <ChatTeardropText size={18} weight="bold" />
              </ToolbarButton>
            )}
            <ToolbarButton
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <ArrowsIn size={18} weight="bold" />
              ) : (
                <ArrowsOut size={18} weight="bold" />
              )}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowJoinOverlay(!showJoinOverlay)}
              active={showJoinOverlay}
              title="Show join code (L)"
            >
              <QrCode size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setHideResponses(!hideResponses)}
              active={hideResponses}
              title="Hide/show responses (H)"
            >
              {hideResponses ? (
                <Eye size={18} weight="bold" />
              ) : (
                <EyeSlash size={18} weight="bold" />
              )}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setShowHotkeys(true)}
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={18} weight="bold" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton onClick={handleRestart} title="Restart quiz (R)">
              <ArrowsClockwise size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton
              onClick={handleEnd}
              title="End poll"
              variant="danger"
            >
              <X size={18} weight="bold" />
            </ToolbarButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingAvatars({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) return null;

  return (
    <div className="relative w-full max-w-2xl h-48 my-4">
      {participants.map((p, i) => {
        const hash =
          p.id.charCodeAt(0) + p.id.charCodeAt(Math.min(p.id.length - 1, 5));
        const x = ((hash * 37 + i * 89) % 70) + 15;
        const y = ((hash * 53 + i * 67) % 50) + 25;
        const color = PASTEL_COLORS[i % PASTEL_COLORS.length];

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [0, 12, -8, 0],
              y: [0, -10, 6, 0],
            }}
            transition={{
              opacity: { duration: 0.4, delay: i * 0.1 },
              scale: { duration: 0.4, delay: i * 0.1 },
              x: { repeat: Infinity, duration: 3 + (i % 3), ease: "easeInOut" },
              y: { repeat: Infinity, duration: 4 + (i % 2), ease: "easeInOut" },
            }}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden bg-primary-50 shadow-lg"
              style={{ outline: `2px solid ${color}` }}
            >
              <img
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${p.avatarSeed || p.id}`}
                alt={p.name}
                className="w-full h-full"
                loading="lazy"
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 bg-white/90 rounded-full px-2 py-0.5 truncate max-w-20 shadow-sm">
              {p.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function HotkeysModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-800">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">
                  Presenting
                </h4>
                <div className="flex flex-col gap-3">
                  <HotkeyRow keyLabel="→" description="Go to next slide" />
                  <HotkeyRow keyLabel="←" description="Go to previous slide" />
                  <HotkeyRow keyLabel="P" description="Exit presentation" />
                  <HotkeyRow
                    keyLabel="Esc"
                    description="Exit / close overlay"
                  />
                  <HotkeyRow keyLabel="F" description="Toggle fullscreen" />
                  <HotkeyRow keyLabel="S" description="Start quiz" />
                  <HotkeyRow keyLabel="R" description="Restart quiz" />
                  <HotkeyRow
                    keyLabel="B"
                    description="Show or hide blank screen"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">
                  Participation
                </h4>
                <div className="flex flex-col gap-3">
                  <HotkeyRow
                    keyLabel="H"
                    description="Hide or show responses"
                  />
                  <HotkeyRow keyLabel="L" description="Show joining code" />
                  <HotkeyRow
                    keyLabel="?"
                    description="Show keyboard shortcuts"
                  />
                  <HotkeyRow keyLabel="Q" description="Toggle Q&A sidebar" />
                  <HotkeyRow
                    keyLabel="↑/↓"
                    description="Navigate Q&A questions"
                  />
                  <HotkeyRow
                    keyLabel="Enter"
                    description="Mark Q&A as answered"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HotkeyRow({
  keyLabel,
  description,
}: {
  keyLabel: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <kbd className="text-xs font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg min-w-9 text-center">
        {keyLabel}
      </kbd>
      <span className="text-sm text-gray-600">{description}</span>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  active,
  title,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  variant?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        variant === "danger"
          ? "text-gray-500 hover:bg-red-50 hover:text-red-500"
          : active
            ? "bg-gray-200 text-gray-800"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
