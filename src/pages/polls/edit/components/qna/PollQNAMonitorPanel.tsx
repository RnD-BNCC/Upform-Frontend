import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CaretDown,
  Check,
  Eye,
  ThumbsUp,
} from "@phosphor-icons/react";
import { useQAQuestions } from "@/api/questions";
import { useQuerySlideResults } from "@/api/polls";
import PageMenuDropdown from "@/components/builder/layout/form/PageMenuDropdown";
import { publicApiClient } from "@/config/api-client";
import { Api } from "@/constants/api";
import { useLiveResults, useLiveSlide, useSocket } from "@/hooks/polls";
import type {
  Poll,
  PollSlide,
  QAQuestion,
  QNAMonitorSort,
  QAResult,
} from "@/types/polling";

function toQuestionKey(text: string, participantName?: string) {
  return `${text.trim().toLowerCase()}::${participantName?.trim().toLowerCase() ?? ""}`;
}

function formatTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildQAResults(
  resultData: QAResult | null | undefined,
  questions: QAQuestion[],
) {
  const questionMap = new Map(
    questions.map((question) => [
      toQuestionKey(question.text, question.authorName),
      question,
    ]),
  );

  if (resultData && resultData.length > 0) {
    return resultData.map((item) => {
      const matchingQuestion = questionMap.get(
        toQuestionKey(item.text, item.participantName),
      );
      return {
        ...item,
        createdAt: matchingQuestion?.createdAt ?? item.createdAt,
        likeCount: matchingQuestion?.likeCount ?? item.likeCount ?? 0,
      };
    });
  }

  return questions.map((question) => ({
    text: question.text,
    participantName: question.authorName,
    createdAt: question.createdAt,
    isAnswered: false,
    likeCount: question.likeCount,
    voteId: question.pollVoteId ?? question.id,
  })) as QAResult;
}

function sortQuestions(data: QAResult, sort: QNAMonitorSort) {
  return [...data].sort((a, b) => {
    if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
    if (sort === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    const likeDiff = (b.likeCount ?? 0) - (a.likeCount ?? 0);
    if (likeDiff !== 0) return likeDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

const SORT_OPTIONS: Array<{ id: QNAMonitorSort; label: string }> = [
  { id: "votes", label: "Most voted" },
  { id: "latest", label: "Latest" },
  { id: "oldest", label: "Oldest" },
];

function QNASortDropdown({
  onChange,
  value,
}: {
  onChange: (value: QNAMonitorSort) => void;
  value: QNAMonitorSort;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = SORT_OPTIONS.find((option) => option.id === value);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 min-w-36 cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
      >
        <span className="flex-1 truncate text-left">
          {selected?.label ?? "Most voted"}
        </span>
        <CaretDown
          size={12}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <PageMenuDropdown
            activeId={value}
            className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            options={SORT_OPTIONS}
            showIcons={false}
            variant="field"
            onSelect={(nextValue) => {
              onChange(nextValue as QNAMonitorSort);
              setOpen(false);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type PollQNAMonitorPanelProps = {
  poll: Poll;
  pollId: string;
  selectedSlideId?: string;
};

export default function PollQNAMonitorPanel({
  poll,
  pollId,
  selectedSlideId,
}: PollQNAMonitorPanelProps) {
  const { socketRef, connected } = useSocket(pollId);
  const liveSlide = useLiveSlide(socketRef, connected);
  const [highlightedVoteId, setHighlightedVoteId] = useState<string | null>(null);
  const [sort, setSort] = useState<QNAMonitorSort>("votes");
  const [optimisticAnswered, setOptimisticAnswered] = useState<Set<string>>(
    new Set(),
  );
  const [optimisticRestored, setOptimisticRestored] = useState<Set<string>>(
    new Set(),
  );

  const currentSlideIndex = liveSlide.currentSlide ?? poll.currentSlide ?? 0;
  const activeSlide = poll.slides[currentSlideIndex];
  const qaSlide = useMemo<PollSlide | undefined>(() => {
    const selectedSlide = poll.slides.find((slide) => slide.id === selectedSlideId);
    if (selectedSlide?.type === "qa") return selectedSlide;
    if (activeSlide?.type === "qa") return activeSlide;
    return poll.slides.find((slide) => slide.type === "qa");
  }, [activeSlide, poll.slides, selectedSlideId]);

  const {
    data: initialQuestions = [],
    isFetching: isQuestionsFetching,
    refetch: refetchQuestions,
  } = useQAQuestions(pollId);
  const [realtimeQuestions, setRealtimeQuestions] = useState<QAQuestion[]>([]);
  const qaQuestions = useMemo(() => {
    const questions = new Map<string, QAQuestion>();
    initialQuestions.forEach((question) => questions.set(question.id, question));
    realtimeQuestions.forEach((question) => questions.set(question.id, question));
    return Array.from(questions.values());
  }, [initialQuestions, realtimeQuestions]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleQuestionNew = (question: QAQuestion) => {
      setRealtimeQuestions((prev) => {
        if (prev.some((item) => item.id === question.id)) return prev;
        return [...prev, { ...question, likedByIds: question.likedByIds ?? [] }];
      });
    };
    const handleLikeUpdated = (data: {
      likedByIds: string[];
      likeCount: number;
      questionId: string;
    }) => {
      setRealtimeQuestions((prev) =>
        prev.map((question) =>
          question.id === data.questionId
            ? {
                ...question,
                likedByIds: data.likedByIds,
                likeCount: data.likeCount,
              }
            : question,
        ),
      );
    };
    const handleReset = () => {
      setRealtimeQuestions([]);
      setHighlightedVoteId(null);
    };

    socket.on("question:new", handleQuestionNew);
    socket.on("question:like_updated", handleLikeUpdated);
    socket.on("reset-scores", handleReset);
    return () => {
      socket.off("question:new", handleQuestionNew);
      socket.off("question:like_updated", handleLikeUpdated);
      socket.off("reset-scores", handleReset);
    };
  }, [socketRef, connected]);

  const { results: liveResults } = useLiveResults(
    socketRef,
    qaSlide?.id,
    connected,
  );
  const {
    data: fetchedResults,
    isFetching: isResultsFetching,
    refetch: refetchResults,
  } = useQuerySlideResults(
    pollId,
    qaSlide?.id ?? "",
  );

  const qaResults = useMemo(() => {
    const source = (liveResults ?? fetchedResults ?? null) as QAResult | null;
    const merged = buildQAResults(source, qaQuestions);
    return merged.map((question) => {
      if (!question.voteId) return question;
      if (optimisticAnswered.has(question.voteId)) {
        return { ...question, isAnswered: true };
      }
      if (optimisticRestored.has(question.voteId)) {
        return { ...question, isAnswered: false };
      }
      return question;
    });
  }, [
    fetchedResults,
    liveResults,
    optimisticAnswered,
    optimisticRestored,
    qaQuestions,
  ]);

  const sortedQuestions = useMemo(
    () => sortQuestions(qaResults, sort),
    [qaResults, sort],
  );
  const unansweredCount = qaResults.filter((question) => !question.isAnswered).length;
  const answeredCount = qaResults.length - unansweredCount;

  const effectiveHighlightedVoteId = useMemo(() => {
    if (!highlightedVoteId) return null;
    const stillExists = qaResults.some(
      (question) => question.voteId === highlightedVoteId,
    );
    return stillExists ? highlightedVoteId : null;
  }, [highlightedVoteId, qaResults]);

  const handleHighlight = (voteId: string | null) => {
    setHighlightedVoteId(voteId);
    socketRef.current?.emit("qa-highlight", { pollId, voteId });
  };

  const handleToggleAnswered = async (voteId: string) => {
    if (!qaSlide) return;
    const isAnswered = qaResults.find((question) => question.voteId === voteId)
      ?.isAnswered;
    if (isAnswered) {
      setOptimisticRestored((prev) => new Set(prev).add(voteId));
    } else {
      setOptimisticAnswered((prev) => new Set(prev).add(voteId));
    }

    try {
      await publicApiClient.patch(Api.publicPollVoteAnswer(pollId, qaSlide.id, voteId));
    } catch (error) {
      console.error("[handleToggleAnswered]", error);
      setOptimisticAnswered((prev) => {
        const next = new Set(prev);
        next.delete(voteId);
        return next;
      });
      setOptimisticRestored((prev) => {
        const next = new Set(prev);
        next.delete(voteId);
        return next;
      });
    }
  };

  const highlightedQuestion = effectiveHighlightedVoteId
    ? qaResults.find((question) => question.voteId === effectiveHighlightedVoteId)
    : null;
  const isRefreshing = isQuestionsFetching || isResultsFetching;

  const handleRefresh = () => {
    void refetchQuestions();
    if (qaSlide) void refetchResults();
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-500">
              Poll Q&A
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Q&A monitor
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Live question queue for {poll.title || "Untitled Poll"}
            </p>
            {qaSlide ? (
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-primary-600">
                Monitoring: {qaSlide.question || "Untitled Q&A"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowClockwise
              size={14}
              weight="bold"
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Total</p>
            <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">
              {qaResults.length}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Open</p>
            <p className="mt-1 text-2xl font-black text-emerald-600 tabular-nums">
              {unansweredCount}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400">Answered</p>
            <p className="mt-1 text-2xl font-black text-gray-500 tabular-nums">
              {answeredCount}
            </p>
          </div>
        </div>

          {!qaSlide ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-400">
              This poll does not have a Q&A slide yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Question queue
                    </p>
                    <p className="text-xs text-gray-400">
                      Select a question to push it to the presenter screen.
                    </p>
                  </div>
                  <QNASortDropdown value={sort} onChange={setSort} />
                </div>

                {sortedQuestions.length === 0 ? (
                  <div className="px-4 py-16 text-center text-sm text-gray-400">
                    Waiting for audience questions.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sortedQuestions.map((question) => {
                      const isHighlighted =
                        question.voteId === effectiveHighlightedVoteId;
                      return (
                        <article
                          key={question.voteId ?? question.text}
                          className={`grid gap-3 px-4 py-4 transition md:grid-cols-[minmax(0,1fr)_auto] ${
                            isHighlighted ? "bg-primary-50/60" : "bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleHighlight(question.voteId ?? null)}
                            className="min-w-0 text-left"
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">
                                {question.participantName || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-300">-</span>
                              <span className="text-xs text-gray-400">
                                {formatTime(question.createdAt)}
                              </span>
                              {question.isAnswered ? (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                                  Answered
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`text-base font-semibold leading-relaxed ${
                                question.isAnswered
                                  ? "text-gray-400 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {question.text}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                              <ThumbsUp size={12} weight="fill" />
                              {question.likeCount ?? 0}
                            </div>
                          </button>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleHighlight(question.voteId ?? null)
                              }
                              className={`inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs font-bold ${
                                isHighlighted
                                  ? "bg-primary-600 text-white"
                                  : "border border-primary-100 text-primary-600 hover:bg-primary-50"
                              }`}
                            >
                              <Eye size={13} weight="bold" />
                              Push
                            </button>
                            {question.voteId ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleAnswered(question.voteId!)
                                }
                                className="inline-flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-gray-50"
                              >
                                {question.isAnswered ? (
                                  <ArrowCounterClockwise size={13} weight="bold" />
                                ) : (
                                  <Check size={13} weight="bold" />
                                )}
                                {question.isAnswered ? "Restore" : "Done"}
                              </button>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-900">Presenter cue</p>
                <p className="mt-1 text-xs text-gray-400">
                  This is the question currently pushed to presenter.
                </p>

                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  {highlightedQuestion ? (
                    <>
                      <p className="text-xs font-bold text-gray-400">
                        {highlightedQuestion.participantName || "Anonymous"}
                      </p>
                      <p className="mt-2 text-lg font-bold leading-relaxed text-gray-950">
                        {highlightedQuestion.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleHighlight(null)}
                        className="mt-4 h-9 rounded-md border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-white"
                      >
                        Clear cue
                      </button>
                    </>
                  ) : (
                    <p className="py-8 text-center text-sm text-gray-400">
                      No question selected.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
    </div>
  );
}
