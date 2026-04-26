import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ThumbsUp } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import { useMutationSubmitVote, useQueryPublicPoll } from "@/api/polls";
import { useQAQuestions } from "@/api/questions";
import { Leaderboard, QAModal } from "@/components/polling";
import { TimerRing } from "@/components/icons";
import { useQASocket, useSocket, useLiveSlide } from "@/hooks";
import {
  getParticipantId,
  getParticipantName,
  getAvatarSeed,
  setParticipantName,
} from "@/utils/polls/participant";
import type { QAQuestion } from "@/types/polling";
import {
  AudienceShell,
  AudienceSlideInput,
  EndedScreen,
  NameConfirmScreen,
  NameEntryScreen,
  ThankYouScreen,
  WaitingScreen,
} from "./components";

export default function LiveVotePage() {
  const { code } = useParams<{ code: string }>();
  const { data: poll, isLoading, error } = useQueryPublicPoll(code ?? "");
  const { socketRef, connected } = useSocket(poll?.id);
  const {
    currentSlide: liveSlide,
    pollStatus: liveStatus,
    countdown,
    leaderboardScores,
    scoreUpdate,
    timerState,
    answerRevealed,
  } = useLiveSlide(socketRef, connected);

  const [voted, setVoted] = useState(false);
  const [lastScoreFeedback, setLastScoreFeedback] = useState<{
    points: number;
    isCorrect: boolean;
  } | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | null>(
    null,
  );
  const [participantNameState, setParticipantNameState] = useState<
    string | null
  >(getParticipantName());
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [audienceTimerRemaining, setAudienceTimerRemaining] = useState<
    number | null
  >(null);
  const [submitBlocked, setSubmitBlocked] = useState(false);
  const [showQAModal, setShowQAModal] = useState(false);
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);

  const showCountdown = countdown !== null;
  const { data: initialQAQuestions } = useQAQuestions(poll?.id);

  useEffect(() => {
    if (!timerState) {
      setAudienceTimerRemaining(null);
      return;
    }

    const { duration, startedAt } = timerState;
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, Math.ceil(duration - elapsed));
      setAudienceTimerRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [timerState]);

  useEffect(() => {
    if (audienceTimerRemaining !== 0) return;
    const timeout = setTimeout(() => setAudienceTimerRemaining(null), 2000);
    return () => clearTimeout(timeout);
  }, [audienceTimerRemaining]);

  useEffect(() => {
    setSubmitBlocked(false);
  }, [liveSlide]);

  useEffect(() => {
    if (audienceTimerRemaining === 0) setSubmitBlocked(true);
  }, [audienceTimerRemaining]);

  useEffect(() => {
    if (answerRevealed) setSubmitBlocked(true);
  }, [answerRevealed]);

  useEffect(() => {
    if (initialQAQuestions) setQaQuestions(initialQAQuestions);
  }, [initialQAQuestions]);

  const { submitQuestion, toggleLike } = useQASocket({
    socketRef,
    pollId: poll?.id,
    myUserId: getParticipantId(),
    questions: qaQuestions,
    onQuestionsChange: setQaQuestions,
  });

  useEffect(() => {
    setNameConfirmed(false);
    setParticipantNameState(getParticipantName());
  }, [code]);

  useEffect(() => {
    if (poll) setCurrentSlideIndex(poll.currentSlide);
  }, [poll?.currentSlide]);

  useEffect(() => {
    if (liveSlide !== null) {
      setCurrentSlideIndex(liveSlide);
      setVoted(false);
      setAudienceTimerRemaining(null);
    }
  }, [liveSlide]);

  useEffect(() => {
    if (liveStatus === "waiting") {
      setVoted(false);
      setLastScoreFeedback(null);
    }
  }, [liveStatus]);

  useEffect(() => {
    if (scoreUpdate && scoreUpdate.participantId === getParticipantId()) {
      setLastScoreFeedback({
        points: scoreUpdate.points,
        isCorrect: scoreUpdate.isCorrect,
      });
    }
  }, [scoreUpdate]);

  useEffect(() => {
    if (poll && participantNameState && nameConfirmed && socketRef.current) {
      socketRef.current.emit("join-participant", {
        pollId: poll.id,
        participantId: getParticipantId(),
        name: participantNameState,
        avatarSeed: getAvatarSeed(),
      });
    }
  }, [poll?.id, participantNameState, nameConfirmed, connected, socketRef]);

  const handleNameSubmit = useCallback(
    (name: string) => {
      setParticipantName(name);
      setParticipantNameState(name);
      setNameConfirmed(true);

      if (poll && socketRef.current) {
        socketRef.current.emit("join-participant", {
          pollId: poll.id,
          participantId: getParticipantId(),
          name,
          avatarSeed: getAvatarSeed(),
        });
      }
    },
    [poll, socketRef],
  );

  const slides = poll?.slides ?? [];
  const activeSlide =
    currentSlideIndex !== null ? slides[currentSlideIndex] : undefined;
  const isQASlide = activeSlide?.type === "qa";

  useEffect(() => {
    if (!isQASlide) setShowQAModal(false);
  }, [isQASlide, currentSlideIndex]);

  const submitVote = useMutationSubmitVote(
    poll?.id ?? "",
    activeSlide?.id ?? "",
    {
      onSuccess: () => {
        if (!isQASlide) setVoted(true);
      },
    },
  );

  const handleSubmit = (value: unknown) => {
    submitVote.mutate({
      participantId: isQASlide
        ? `${getParticipantId()}_qa_${Date.now()}`
        : getParticipantId(),
      value,
    });
  };

  const effectiveStatus = liveStatus ?? poll?.status;

  if (isLoading) {
    return (
      <AudienceShell>
        <div className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-primary-500" />
        </div>
      </AudienceShell>
    );
  }

  if (error || !poll) {
    return (
      <AudienceShell>
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Poll not found
            </h2>
            <p className="text-sm text-gray-400">
              The poll code may be incorrect or the poll has ended.
            </p>
          </div>
        </div>
      </AudienceShell>
    );
  }

  if (
    currentSlideIndex !== null &&
    currentSlideIndex === slides.length &&
    leaderboardScores.length > 0
  ) {
    return (
      <div className="min-h-screen flex">
        <Leaderboard
          currentParticipantId={getParticipantId()}
          scores={leaderboardScores}
        />
      </div>
    );
  }

  if (effectiveStatus === "ended") {
    return (
      <AudienceShell>
        <EndedScreen />
      </AudienceShell>
    );
  }

  if (!participantNameState || !nameConfirmed) {
    return (
      <AudienceShell>
        {participantNameState ? (
          <NameConfirmScreen
            name={participantNameState}
            onConfirm={() => setNameConfirmed(true)}
            onChange={() => setParticipantNameState(null)}
          />
        ) : (
          <NameEntryScreen onSubmit={handleNameSubmit} />
        )}
      </AudienceShell>
    );
  }

  if (showCountdown) {
    return (
      <div className="min-h-screen bg-primary-800 flex items-center justify-center p-5">
        <AnimatePresence mode="wait">
          <motion.span
            key={countdown}
            initial={{ scale: 2.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-[100px] font-black text-white select-none"
          >
            {countdown === 0 ? "GO!" : countdown}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  if (effectiveStatus === "waiting") {
    return (
      <AudienceShell>
        <WaitingScreen
          name={participantNameState}
          questionNumber={
            currentSlideIndex !== null ? currentSlideIndex + 1 : undefined
          }
          totalQuestions={slides.length}
        />
      </AudienceShell>
    );
  }

  return (
    <>
      <AudienceShell>
        {activeSlide && (
          <div className="flex flex-col gap-6">
            {isQASlide ? (
              <div className="flex flex-col items-center justify-center gap-6 py-8 text-center">
                <p className="text-sm text-gray-400 font-medium">
                  Click the button to participate!
                </p>
                <div className="w-14 h-14 rounded-full flex items-center justify-center">
                  <ThumbsUp
                    size={24}
                    className="text-primary-400"
                    weight="bold"
                  />
                </div>
                <button
                  onClick={() => setShowQAModal(true)}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold py-3.5 rounded-full transition-colors cursor-pointer shadow-md"
                >
                  Open Q&amp;A
                </button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Question {(currentSlideIndex ?? 0) + 1}
                  </p>
                  <h2
                    className="text-lg sm:text-xl font-bold text-gray-900 leading-snug"
                    dangerouslySetInnerHTML={{
                      __html: activeSlide.question || "No question",
                    }}
                  />
                </div>

                {audienceTimerRemaining !== null &&
                  audienceTimerRemaining > 0 &&
                  timerState &&
                  !voted && (
                    <div className="flex justify-center mb-2">
                      <TimerRing
                        remaining={audienceTimerRemaining}
                        total={timerState.duration}
                        size={64}
                      />
                    </div>
                  )}

                {voted ? (
                  <ThankYouScreen
                    scoreFeedback={answerRevealed ? lastScoreFeedback : null}
                    hasCorrectAnswer
                  />
                ) : (
                  <AudienceSlideInput
                    slide={activeSlide}
                    onSubmit={handleSubmit}
                    isPending={submitVote.isPending || submitBlocked}
                    participantName={participantNameState ?? ""}
                  />
                )}
              </>
            )}
          </div>
        )}
      </AudienceShell>

      <AnimatePresence>
        {audienceTimerRemaining === 0 && (
          <motion.div
            key="timesup"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl px-8 py-6 text-center shadow-2xl">
              <p className="text-2xl font-black text-gray-900">Time's up!</p>
              <p className="text-sm text-gray-400 mt-1">
                Waiting for next slide...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQAModal && participantNameState && (
          <QAModal
            myUserId={getParticipantId()}
            myName={participantNameState}
            questions={qaQuestions}
            onQuestionsChange={setQaQuestions}
            submitQuestion={submitQuestion}
            toggleLike={toggleLike}
            onClose={() => setShowQAModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
