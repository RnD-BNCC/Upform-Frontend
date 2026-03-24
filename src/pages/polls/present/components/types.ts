import type {
  Participant,
  ImageLayout,
  SlideType,
  SlideSettings,
  SlideResults,
  PollSlide,
} from "@/types/polling";

export interface PresentHeaderProps {
  title: string;
  code: string;
  currentSlide: number;
  totalSlides: number;
  participantCount: number;
  joinUrl: string;
  textColor: string;
}

export interface WaitingRoomViewProps {
  imageUrl: string | undefined;
  imageLayout: ImageLayout;
  currentSlide: number;
  totalSlides: number;
  participants: Participant[];
  textColor: string;
}

export interface SlidePresenterProps {
  activeSlide: PollSlide;
  imageUrl: string | undefined;
  imageLayout: ImageLayout;
  hideResponses: boolean;
  textColor: string;
  bgColor: string;
  effectiveResults: SlideResults | null;
  slideSettings: SlideSettings;
  qaHighlightedVoteId: string | null;
  revealPhase: boolean;
  onQANext: () => void;
  onQAPrev: () => void;
  onMarkQAAnswered: (voteId: string) => Promise<void>;
}

export interface PresentControlsProps {
  currentSlide: number;
  totalSlides: number;
  isLeaderboardSlide: boolean;
  isFirstSlide: boolean;
  isWaitingRoom: boolean;
  isLastQuestionSlide: boolean;
  isQASlide: boolean;
  isFullscreen: boolean;
  showQASidebar: boolean;
  showJoinOverlay: boolean;
  hideResponses: boolean;
  showSlideGrid: boolean;
  timerActive: boolean;
  timerRemaining: number | null;
  showTimerPopover: boolean;
  revealPhase: boolean;
  slideType: SlideType | undefined;
  slideSettings: SlideSettings;
  onPrev: () => void;
  onPrimaryAction: () => void;
  onEnd: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
  onToggleQASidebar: () => void;
  onToggleJoinOverlay: () => void;
  onToggleHideResponses: () => void;
  onToggleSlideGrid: () => void;
  onShowHotkeys: () => void;
  onSetShowTimerPopover: (show: boolean) => void;
  onStopTimer: () => void;
  onStartTimer: (seconds: number) => void;
}
