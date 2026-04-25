import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import {
  CaretLeft,
  ArrowRight,
  X,
  QrCode,
  ArrowsOut,
  ArrowsIn,
  Lightbulb,
  EyeSlash,
  Eye,
  Keyboard,
  ArrowsClockwise,
  Trophy,
  ChatTeardropText,
  Timer,
} from "@phosphor-icons/react";
import type { PresentControlsProps } from "./types";

function ToolbarButton({
  children,
  onClick,
  disabled,
  active,
  title,
  variant,
}: {
  children: ReactNode;
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

export default function PresentControls({
  currentSlide: _currentSlide,
  totalSlides: _totalSlides,
  isLeaderboardSlide,
  isFirstSlide,
  isWaitingRoom,
  isLastQuestionSlide,
  isQASlide,
  isFullscreen,
  showQASidebar,
  showJoinOverlay,
  hideResponses,
  showSlideGrid: _showSlideGrid,
  timerActive,
  timerRemaining,
  showTimerPopover,
  revealPhase,
  slideType,
  slideSettings,
  onPrev,
  onPrimaryAction,
  onEnd,
  onRestart,
  onToggleFullscreen,
  onToggleQASidebar,
  onToggleJoinOverlay,
  onToggleHideResponses,
  onToggleSlideGrid,
  onShowHotkeys,
  onSetShowTimerPopover,
  onStartTimer,
}: PresentControlsProps) {
  const [showFloatingTimer, setShowFloatingTimer] = useState(true);

  useEffect(() => {
    if (timerActive) {
      setShowFloatingTimer(true);
    }
  }, [timerActive]);

  const hasCorrectAnswer =
    (slideType === "multiple_choice" && !!slideSettings?.correctAnswer) ||
    (slideType === "guess_number" && slideSettings?.correctNumber !== undefined) ||
    (slideType === "word_cloud" && !!slideSettings?.correctAnswers?.length) ||
    (slideType === "pin_on_image" && !!slideSettings?.correctArea);

  const primaryButtonClass = isLeaderboardSlide
    ? "bg-red-500 hover:bg-red-600 text-white"
    : isWaitingRoom
      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
      : isLastQuestionSlide && (!hasCorrectAnswer || revealPhase)
        ? "bg-amber-500 hover:bg-amber-600 text-white"
        : "bg-primary-500 hover:bg-primary-600 text-white";

  const primaryLabel = isLeaderboardSlide
    ? "End poll"
    : isWaitingRoom
      ? "Start quiz"
      : revealPhase
        ? isLastQuestionSlide ? "Leaderboard" : "Next question"
        : hasCorrectAnswer
          ? "Reveal answer"
          : isLastQuestionSlide
            ? "Leaderboard"
            : "Next slide";

  const showTimerButton =
    (slideType === "multiple_choice" || slideType === "guess_number" || slideType === "word_cloud") &&
    !isWaitingRoom &&
    !isLeaderboardSlide &&
    !revealPhase;
  const timerPct =
    timerActive && timerRemaining !== null
      ? timerRemaining / (slideSettings.timer ?? (timerRemaining || 1))
      : 1;
  const redIntensity =
    timerRemaining !== null && timerRemaining <= 10
      ? Math.max(0, Math.min(1, (10 - timerRemaining) / 10))
      : 0;
  const timerColor =
    timerRemaining !== null && timerRemaining <= 10
      ? `rgb(${239 - redIntensity * 88}, ${68 - redIntensity * 43}, ${68 - redIntensity * 40})`
      : timerPct < 0.3
        ? "#F59E0B"
        : "#10B981";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-24 z-20 flex items-end justify-center pb-5 group">
        <div className="flex items-center justify-between gap-4 bg-white rounded-full shadow-xl border border-gray-200 px-2.5 py-1.5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={onPrev}
              disabled={isFirstSlide && !isLeaderboardSlide}
              title="Previous slide (←)"
            >
              <CaretLeft size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton
              onClick={onToggleSlideGrid}
              title="Slide overview"
            >
              <Lightbulb size={18} weight="bold" />
            </ToolbarButton>
            <button
              onClick={onPrimaryAction}
              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer ml-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${primaryButtonClass}`}
            >
              {isLeaderboardSlide ? (
                <X size={14} weight="bold" />
              ) : revealPhase ? (
                isLastQuestionSlide
                  ? <Trophy size={14} weight="fill" />
                  : <ArrowRight size={14} weight="bold" />
              ) : isLastQuestionSlide && !isWaitingRoom && !hasCorrectAnswer ? (
                <Trophy size={14} weight="fill" />
              ) : (
                <ArrowRight size={14} weight="bold" />
              )}
              {primaryLabel}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {isQASlide && (
              <ToolbarButton
                onClick={onToggleQASidebar}
                active={showQASidebar}
                title="Q&A sidebar (Q)"
              >
                <ChatTeardropText size={18} weight="bold" />
              </ToolbarButton>
            )}
            <ToolbarButton
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <ArrowsIn size={18} weight="bold" />
              ) : (
                <ArrowsOut size={18} weight="bold" />
              )}
            </ToolbarButton>
            <ToolbarButton
              onClick={onToggleJoinOverlay}
              active={showJoinOverlay}
              title="Show join code (L)"
            >
              <QrCode size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton
              onClick={onToggleHideResponses}
              active={hideResponses}
              title="Hide/show responses (H)"
            >
              {hideResponses ? (
                <Eye size={18} weight="bold" />
              ) : (
                <EyeSlash size={18} weight="bold" />
              )}
            </ToolbarButton>
            <ToolbarButton onClick={onShowHotkeys} title="Keyboard shortcuts (?)">
              <Keyboard size={18} weight="bold" />
            </ToolbarButton>
            {showTimerButton && (
              <div className="relative" data-timer-popover>
                <ToolbarButton
                  onClick={() => {
                    if (timerActive) {
                      setShowFloatingTimer((value) => !value);
                    } else {
                      onSetShowTimerPopover(!showTimerPopover);
                    }
                  }}
                  active={timerActive && showFloatingTimer}
                  title={
                    timerActive
                      ? showFloatingTimer
                        ? "Hide timer"
                        : "Show timer"
                      : "Set timer"
                  }
                >
                  {timerActive && timerRemaining !== null ? (
                    showFloatingTimer ? (
                      <EyeSlash size={18} weight="bold" />
                    ) : (
                      <Eye size={18} weight="bold" />
                    )
                  ) : (
                    <Timer size={18} weight="bold" />
                  )}
                </ToolbarButton>
                <AnimatePresence>
                  {showTimerPopover && !timerActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-44 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                        Timer
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {[15, 30, 60, 90].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => {
                              onStartTimer(sec);
                              onSetShowTimerPopover(false);
                            }}
                            className="text-xs font-semibold py-1.5 rounded-lg border border-gray-200 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                      {slideSettings.timer && slideSettings.timer > 0 && (
                        <button
                          onClick={() => {
                            onStartTimer(slideSettings.timer!);
                            onSetShowTimerPopover(false);
                          }}
                          className="w-full text-xs font-semibold py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer"
                        >
                          Slide default ({slideSettings.timer}s)
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton onClick={onRestart} title="Restart quiz (R)">
              <ArrowsClockwise size={18} weight="bold" />
            </ToolbarButton>
            <ToolbarButton onClick={onEnd} title="End poll" variant="danger">
              <X size={18} weight="bold" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {timerActive && timerRemaining !== null && showFloatingTimer ? (
          <motion.div
            key="floating-timer"
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-28 right-8 z-50 select-none text-[clamp(40px,5vw,76px)] font-black leading-none tabular-nums"
            style={{
              color: timerColor,
              textShadow:
                "0 3px 18px rgba(0,0,0,0.35), 0 0 26px currentColor",
            }}
          >
            {timerRemaining}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
