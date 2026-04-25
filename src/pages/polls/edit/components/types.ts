import type { RefObject } from "react";
import type { PollSlide, SlideType, SlideSettings } from "@/types/polling";

export interface MobileSlideNavProps {
  title: string;
  slides: PollSlide[];
  selectedIndex: number;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onPresent: () => void;
  onSave: () => void;
  isAddPending: boolean;
}

export interface SlidesSidebarProps {
  activePanel: "edit" | "results";
  title: string;
  pollCode: string;
  slides: PollSlide[];
  selectedIndex: number;
  liveQuestion: string | null;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
  onReorderSlides: (orderedIds: string[]) => void;
  saveReorderRef: RefObject<(() => void) | null>;
  onCopyCode: () => void;
  onPresent: () => void;
  onSave: () => void;
  onShowEdit: () => void;
  onShowResults: () => void;
  isAddPending: boolean;
}

export interface MobileSettingsProps {
  type: SlideType;
  options: string[];
  settings: SlideSettings;
  onTypeChange: (type: SlideType) => void;
  onOptionsChange: (options: string[]) => void;
  onSettingsChange: (settings: SlideSettings) => void;
  onBlur: () => void;
}
