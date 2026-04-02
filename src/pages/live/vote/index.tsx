import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryPublicPoll, useMutationSubmitVote } from "@/api/polls";
import { useQAQuestions } from "@/api/questions";
import { useSocket, useLiveSlide } from "@/hooks/polls";
import { useQASocket } from "@/hooks/useQASocket";
import Leaderboard from "@/components/polling/Leaderboard";
import QAModal from "@/components/polling/QAModal";
import {
  getParticipantId,
  getParticipantName,
  setParticipantName,
  getAvatarSeed,
  randomizeAvatarSeed,
} from "@/utils/participant";
import type { SlideType, PollSlide, QAQuestion } from "@/types/polling";
import { SCALE_COLORS } from "@/config/polling";
import {
  SpinnerGap,
  Presentation,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  MapPin,
  ThumbsUp,
} from "@phosphor-icons/react";
import { SuccessIcon } from "@/components/ui/icons";
import { TimerRing } from "@/components/ui/TimerRing";

function AudienceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <p className="text-lg font-bold italic text-gray-900 mb-6">UpForm</p>

        {children}
      </div>
    </div>
  );
}

function NameConfirmScreen({
  name,
  onConfirm,
  onChange,
}: {
  name: string;
  onConfirm: () => void;
  onChange: () => void;
}) {
  const [seed, setSeed] = useState(getAvatarSeed);

  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="relative">
        <img
          src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`}
          alt="Your avatar"
          className="w-20 h-20 rounded-full bg-primary-50"
        />
        <button
          onClick={() => setSeed(randomizeAvatarSeed())}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 transition-colors cursor-pointer shadow-sm"
          title="Randomize avatar"
        >
          <ArrowsClockwise size={16} weight="bold" />
        </button>
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium mb-1">
          You're joining as
        </p>
        <h2 className="text-xl font-black text-gray-900">{name}</h2>
      </div>
      <button
        onClick={onConfirm}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors cursor-pointer"
      >
        Continue
      </button>
      <button
        onClick={onChange}
        className="text-sm text-gray-400 hover:text-gray-600 font-medium cursor-pointer transition-colors"
      >
        Not you? Change name
      </button>
    </div>
  );
}

function NameEntryScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  const [seed, setSeed] = useState(getAvatarSeed);

  return (
    <div className="flex flex-col items-center gap-5 p-6 text-center">
      <div className="relative">
        <img
          src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`}
          alt="Your avatar"
          className="w-16 h-16 rounded-full bg-primary-50"
        />
        <button
          onClick={() => setSeed(randomizeAvatarSeed())}
          className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-300 transition-colors cursor-pointer shadow-sm"
          title="Randomize avatar"
        >
          <ArrowsClockwise size={14} weight="bold" />
        </button>
      </div>
      <h2 className="text-lg font-bold text-gray-900">What's your name?</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && name.trim() && onSubmit(name.trim())
        }
        placeholder="Enter your name"
        className="w-full text-center text-lg font-semibold border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
        autoFocus
        maxLength={30}
      />
      <button
        onClick={() => name.trim() && onSubmit(name.trim())}
        disabled={!name.trim()}
        className="w-full bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        Join
      </button>
    </div>
  );
}

function WaitingScreen({
  name,
  questionNumber,
  totalQuestions,
}: {
  name: string;
  questionNumber?: number;
  totalQuestions?: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
        <Presentation size={36} className="text-primary-500" weight="bold" />
      </div>
      <div>
        {questionNumber !== undefined && totalQuestions ? (
          <>
            <p className="text-xs font-semibold text-primary-500 mb-1">
              Question {questionNumber} of {totalQuestions}
            </p>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Get ready!</h2>
          </>
        ) : (
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Wait for the host to start the quiz.
          </h2>
        )}
        <p className="text-sm text-gray-400">
          Hi <span className="font-semibold text-gray-600">{name}</span>!
        </p>
      </div>
      <SpinnerGap size={24} className="text-primary-400 animate-spin mt-2" />
      <p className="text-xs text-gray-300 mt-2 max-w-xs">
        Please reload your browser or contact us at{" "}
        <span className="font-semibold text-gray-400">contact@bncc.net</span> if
        the quiz won't load.
      </p>
    </div>
  );
}

function ThankYouScreen({
  scoreFeedback,
  hasCorrectAnswer = true,
}: {
  scoreFeedback?: { points: number; isCorrect: boolean } | null;
  hasCorrectAnswer?: boolean;
}) {
  if (scoreFeedback && hasCorrectAnswer) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        {scoreFeedback.isCorrect ? (
          <>
            <CheckCircle size={48} className="text-emerald-500" weight="fill" />
            <h2 className="text-lg font-bold text-gray-900">Correct!</h2>
            <p className="text-2xl font-black text-emerald-500">
              +{scoreFeedback.points}
            </p>
          </>
        ) : (
          <>
            <XCircle size={48} className="text-red-400" weight="fill" />
            <h2 className="text-lg font-bold text-gray-900">Incorrect</h2>
            <p className="text-sm text-gray-400">Better luck next time!</p>
          </>
        )}
        <p className="text-xs text-gray-300 mt-2">
          Waiting for next question...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="relative flex size-12">
        <span className="absolute animate-ping bg-emerald-500 rounded-full h-full w-full opacity-50" />
        <div className="relative">
          <SuccessIcon size={48} />
        </div>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Vote Recorded!</h2>
      <p className="text-sm text-gray-400">Waiting for next question...</p>
    </div>
  );
}

function EndedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <h2 className="text-lg font-bold text-gray-900">Poll has ended</h2>
      <p className="text-sm text-gray-400">Thank you for participating!</p>
    </div>
  );
}

function WordCloudInput({
  onSubmit,
  isPending,
}: {
  onSubmit: (value: unknown) => void;
  isPending: boolean;
}) {
  const [word, setWord] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && word.trim() && !isPending) {
            onSubmit({ word: word.trim() });
            setWord("");
          }
        }}
        placeholder="Type a word..."
        className="text-lg border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-center font-semibold"
        autoFocus
      />
      <button
        onClick={() => {
          if (word.trim()) {
            onSubmit({ word: word.trim() });
            setWord("");
          }
        }}
        disabled={!word.trim() || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}

function MCInput({
  options,
  onSubmit,
  isPending,
}: {
  options: string[];
  onSubmit: (value: unknown) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setSelected(opt)}
          className={`text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ${
            selected === opt
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}
        >
          {opt}
        </button>
      ))}
      <button
        onClick={() => selected && onSubmit({ option: selected })}
        disabled={!selected || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 mt-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}



function ScaleInput({
  statements,
  onSubmit,
  isPending,
  min = 1,
  max = 10,
  minLabel,
  maxLabel,
  colors,
}: {
  statements: string[];
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  colors?: string[];
}) {
  const mid = Math.round((min + max) / 2);
  const [values, setValues] = useState<Record<number, number>>(() =>
    Object.fromEntries(statements.map((_, i) => [i, mid])),
  );
  const [skipped, setSkipped] = useState<Set<number>>(new Set());

  const effectiveStatements = statements.length > 0 ? statements : ["Rating"];

  const handleSubmit = () => {
    onSubmit({
      scales: effectiveStatements.map((stmt, i) => ({
        statement: stmt,
        value: skipped.has(i) ? null : (values[i] ?? mid),
      })),
    });
  };

  const allSkipped = effectiveStatements.every((_, i) => skipped.has(i));

  return (
    <div className="flex flex-col gap-8">
      {effectiveStatements.map((stmt, i) => {
        const isSkipped = skipped.has(i);
        const currentVal = values[i] ?? mid;
        const pct = ((currentVal - min) / (max - min)) * 100;
        const color = colors?.[i] || SCALE_COLORS[i % SCALE_COLORS.length];

        return (
          <div
            key={i}
            className={`transition-opacity ${isSkipped ? "opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg text-gray-900">
                {stmt || `Statement ${i + 1}`}
              </h3>
              <button
                onClick={() => {
                  const next = new Set(skipped);
                  if (isSkipped) next.delete(i);
                  else next.add(i);
                  setSkipped(next);
                }}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer shrink-0 ml-3"
              >
                {isSkipped ? "Undo" : "Skip"}
              </button>
            </div>

            {isSkipped ? (
              <div className="text-sm text-gray-400 italic py-6 text-center">
                Skipped
              </div>
            ) : (
              <div className="pt-1">
                <p className="text-gray-700 text-sm mb-3">{currentVal}</p>
                <div className="relative py-3">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-200" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-4 border-white shadow-md"
                    style={{
                      left: `${pct}%`,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: color,
                    }}
                  />
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={currentVal}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [i]: Number(e.target.value),
                      }))
                    }
                    className="relative w-full h-7 appearance-none bg-transparent cursor-pointer z-10 opacity-0"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">{min}</span>
                  <span className="text-xs text-gray-400">{max}</span>
                </div>
                <div className="flex justify-between -mt-0.5">
                  <span className="text-[11px] text-gray-400 italic">
                    {minLabel || "Strongly disagree"}
                  </span>
                  <span className="text-[11px] text-gray-400 italic">
                    {maxLabel || "Strongly agree"}
                  </span>
                </div>
              </div>
            )}

            {i < effectiveStatements.length - 1 && (
              <div className="border-b border-gray-100 mt-4" />
            )}
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={allSkipped || isPending}
        className="w-full bg-primary-500 text-white font-bold py-3.5 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}

function QAInput({
  onSubmit,
  isPending,
  participantName,
}: {
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  participantName: string;
}) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), participantName });
    setText("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-sm font-semibold text-emerald-500"
          >
            Question submitted!
          </motion.div>
        )}
      </AnimatePresence>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask a question..."
        rows={3}
        className="text-sm border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 resize-none"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Ask"
        )}
      </button>
    </div>
  );
}

function GuessNumberInput({
  onSubmit,
  isPending,
  min,
  max,
}: {
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  min: number;
  max: number;
}) {
  const mid = Math.round((min + max) / 2);
  const [value, setValue] = useState(mid);
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 50;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-base font-medium text-gray-600">
        Your answer: <span className="font-black text-gray-900">{value}</span>
      </p>
      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-[0_0_0_10px_rgba(99,102,241,0.12)]
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_0_10px_rgba(99,102,241,0.12)]"
          style={{
            background: `linear-gradient(to right, #0054a5 0%, #0054a5 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs font-semibold text-gray-400">{min}</span>
          <span className="text-xs font-semibold text-gray-400">{max}</span>
        </div>
      </div>
      <button
        onClick={() => onSubmit({ value })}
        disabled={isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}

function PinOnImageInput({
  imageUrl,
  onSubmit,
  isPending,
}: {
  imageUrl?: string;
  onSubmit: (value: unknown) => void;
  isPending: boolean;
}) {
  const [pinned, setPinned] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPinned({ x, y });
  };

  if (!imageUrl) {
    return (
      <div className="text-center text-sm text-gray-400 py-8 rounded-xl border-2 border-dashed border-gray-200">
        No image set for this slide yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500 text-center font-medium">
        Tap on the image to place your pin
      </p>
      <div
        className="relative rounded-xl overflow-hidden cursor-crosshair border-2 border-gray-200 active:border-primary-400 transition-colors"
        onClick={handleClick}
      >
        <img src={imageUrl} alt="" className="w-full" draggable={false} />
        {pinned && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${pinned.x}%`,
              top: `${pinned.y}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <MapPin
              size={28}
              weight="fill"
              className="text-red-500 drop-shadow-md"
            />
          </div>
        )}
      </div>
      <button
        onClick={() => pinned && onSubmit({ x: pinned.x, y: pinned.y })}
        disabled={!pinned || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Pin it!"
        )}
      </button>
    </div>
  );
}

function AudienceSlideInput({
  slide,
  onSubmit,
  isPending,
  participantName,
}: {
  slide: PollSlide;
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  participantName: string;
}) {
  const settings = (slide.settings ?? {}) as Record<string, unknown>;

  switch (slide.type as SlideType) {
    case "word_cloud":
      return <WordCloudInput onSubmit={onSubmit} isPending={isPending} />;
    case "multiple_choice":
      return (
        <MCInput
          options={slide.options}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      );
    case "scales":
      return (
        <ScaleInput
          statements={slide.options}
          onSubmit={onSubmit}
          isPending={isPending}
          min={
            (settings.scaleMin as number) ??
            (settings.maxSelections as number) ??
            1
          }
          max={
            (settings.scaleMax as number) ?? (settings.maxWords as number) ?? 10
          }
          minLabel={settings.scaleMinLabel as string | undefined}
          maxLabel={settings.scaleMaxLabel as string | undefined}
          colors={(settings.scaleColors as string[]) ?? []}
        />
      );
    case "pin_on_image":
      return (
        <PinOnImageInput
          imageUrl={settings.pinImageUrl as string | undefined}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      );
    case "qa":
      return (
        <QAInput
          onSubmit={onSubmit}
          isPending={isPending}
          participantName={participantName}
        />
      );
    case "guess_number":
      return (
        <GuessNumberInput
          onSubmit={onSubmit}
          isPending={isPending}
          min={(settings.numberMin as number) ?? 0}
          max={(settings.numberMax as number) ?? 10}
        />
      );
    default:
      return null;
  }
}

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
  const showCountdown = countdown !== null;

  const [audienceTimerRemaining, setAudienceTimerRemaining] = useState<
    number | null
  >(null);
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
    const t = setTimeout(() => setAudienceTimerRemaining(null), 2000);
    return () => clearTimeout(t);
  }, [audienceTimerRemaining]);

  // Submit lock: persists when timer expires or answer is revealed; resets on slide change
  const [submitBlocked, setSubmitBlocked] = useState(false);
  useEffect(() => {
    setSubmitBlocked(false);
  }, [liveSlide]);
  useEffect(() => {
    if (audienceTimerRemaining === 0) setSubmitBlocked(true);
  }, [audienceTimerRemaining]);
  useEffect(() => {
    if (answerRevealed) setSubmitBlocked(true);
  }, [answerRevealed]);

  const [showQAModal, setShowQAModal] = useState(false);
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);
  const { data: initialQAQuestions } = useQAQuestions(poll?.id);
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
  }, [poll?.id, participantNameState, nameConfirmed, connected]);

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
    [poll?.id],
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
          <SpinnerGap size={32} className="text-primary-500 animate-spin" />
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
        <Leaderboard scores={leaderboardScores} />
      </div>
    );
  }

  if (effectiveStatus === "ended")
    return (
      <AudienceShell>
        <EndedScreen />
      </AudienceShell>
    );

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
                    hasCorrectAnswer={true}
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
        {showQAModal && poll && participantNameState && (
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
