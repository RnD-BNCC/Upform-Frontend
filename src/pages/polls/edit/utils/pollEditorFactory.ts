import { THEME_PRESETS, type ThemePreset } from "@/config/polling";
import type { Poll, PollSlide, SlideSettings } from "@/types/polling";

export const DEFAULT_POLL_THEME =
  THEME_PRESETS.find((theme) => theme.id === "upform-light") ??
  THEME_PRESETS[0];

export function getThemeSlideSettings(theme: ThemePreset): SlideSettings {
  return {
    bgColor: theme.bgColor,
    barColors: theme.barColors,
    showInstructionsBar: true,
    showQrCode: true,
    textColor: theme.textColor,
  };
}

export function serializeSlideDraft(input: {
  options: string[];
  question: string;
  settings: SlideSettings;
  type: PollSlide["type"];
}) {
  return JSON.stringify(input);
}

export function createLocalSlide(
  theme: ThemePreset,
  pollId = "new",
): PollSlide {
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

export function createLocalPoll(theme: ThemePreset): Poll {
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

export function applyThemeToPollSlides(poll: Poll, theme: ThemePreset): Poll {
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

