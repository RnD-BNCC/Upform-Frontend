import type { CSSProperties, ReactNode } from "react";
import {
  getThemeCssVariables,
  type ThemeConfig,
} from "@/utils/form/themeConfig";
import ThemeLogo from "@/components/builder/preview/shared/ThemeLogo";

const coverTitleClassName = "theme-question-title upform-cover-theme-text";
const coverCaptionClassName = "theme-question-caption upform-cover-theme-text";

function parseHexColor(color: string) {
  if (!color.startsWith("#")) return null;

  const hex = color.slice(1);
  if (hex.length === 3) {
    const [r, g, b] = hex.split("");
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }

  if (hex.length !== 6) return null;

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function getRelativeLuminance(color: string) {
  const rgb = parseHexColor(color);
  if (!rgb) return null;

  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channel(rgb.r) +
    0.7152 * channel(rgb.g) +
    0.0722 * channel(rgb.b)
  );
}

function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableCoverTextColor(themeConfig: CoverPageThemeConfig) {
  const contrastRatio = getContrastRatio(themeConfig.textColor, themeConfig.bg);
  if (contrastRatio === null || contrastRatio >= 3) {
    return themeConfig.textColor;
  }

  const backgroundLuminance = getRelativeLuminance(themeConfig.bg);
  if (backgroundLuminance === null) {
    return themeConfig.textColor;
  }

  return backgroundLuminance > 0.45 ? "#111827" : "#f9fafb";
}

export type CoverPageThemeConfig = ThemeConfig;

function CoverImagePreview({
  coverHeroImage,
  themeConfig,
}: {
  coverHeroImage: string | null;
  themeConfig: CoverPageThemeConfig;
}) {
  if (coverHeroImage) {
    return (
      <img
        src={coverHeroImage}
        alt="Cover"
        className="h-44 w-full rounded-xl object-cover sm:h-56"
      />
    );
  }

  return (
    <div className="flex h-44 w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:h-56">
      <span
        className="text-xs opacity-40"
        style={{ color: themeConfig.textColor }}
      >
        No image
      </span>
    </div>
  );
}

type Props = {
  containerClassName?: string;
  coverBgImage: string | null;
  coverHeroImage: string | null;
  coverLayout: number;
  descriptionContent: ReactNode;
  startButtonLabel: string;
  themeConfig: CoverPageThemeConfig;
  titleContent: ReactNode;
  onStart?: () => void;
};

export default function CoverPageLayout({
  containerClassName = "min-h-full",
  coverBgImage,
  coverHeroImage,
  coverLayout,
  descriptionContent,
  startButtonLabel,
  themeConfig,
  titleContent,
  onStart,
}: Props) {
  const themeVars = getThemeCssVariables(themeConfig);
  const coverTextColor = getReadableCoverTextColor(themeConfig);
  const coverTextAlign =
    coverLayout === 1 || coverLayout === 2 ? "left" : "center";
  const coverTitleStyle = {
    color: coverTextColor,
    "--upform-theme-question-align": coverTextAlign,
    "--upform-theme-question-text": coverTextColor,
    "--upform-theme-question-title-font-weight": "700",
    "--upform-theme-question-title-line-height": "1.12",
    "--upform-theme-question-title-size":
      coverLayout >= 3 ? "2.25rem" : "1.875rem",
  } as CSSProperties;
  const coverCaptionStyle = {
    color: coverTextColor,
    "--upform-theme-question-align": coverTextAlign,
    "--upform-theme-question-caption": coverTextColor,
    "--upform-theme-question-caption-font-weight": "400",
    "--upform-theme-question-caption-line-height": "1.5",
    "--upform-theme-question-caption-size": "1rem",
  } as CSSProperties;
  const buttonClassName = `text-sm font-semibold text-white rounded-lg ${
    onStart
      ? "cursor-pointer transition-opacity hover:opacity-90"
      : "cursor-default select-none"
  }`;

  const renderStartButton = (className: string) => (
    <button
      type="button"
      onClick={onStart}
      className={`${buttonClassName} ${className}`}
      style={{ background: themeConfig.btnBg }}
    >
      {startButtonLabel || "Start"}
    </button>
  );

  return (
    <div
      className={`upform-theme-scope relative flex items-center justify-center px-4 py-12 sm:px-8 sm:py-16 ${containerClassName}`}
      style={
        coverLayout === 3 && coverBgImage
          ? {
              ...themeVars,
              backgroundImage: `url(${coverBgImage})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              fontFamily: themeConfig.fontFamily,
            }
          : {
              ...themeVars,
              background: themeConfig.bg,
              fontFamily: themeConfig.fontFamily,
            }
      }
    >
      <div className="absolute left-4 right-4 top-5 z-20 sm:left-8 sm:right-8 sm:top-8">
        <ThemeLogo insideSurface={false} themeConfig={themeConfig} />
      </div>

      {coverLayout === 1 ? (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <ThemeLogo className="w-full" insideSurface themeConfig={themeConfig} />
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="w-full shrink-0 md:w-1/2">
              <CoverImagePreview
                coverHeroImage={coverHeroImage}
                themeConfig={themeConfig}
              />
            </div>
            <div className="flex w-full flex-1 flex-col gap-4">
              <div className={coverTitleClassName} style={coverTitleStyle}>
                {titleContent}
              </div>
              <div
                className={coverCaptionClassName}
                style={{ ...coverCaptionStyle, opacity: 0.65 }}
              >
                {descriptionContent}
              </div>
              {renderStartButton("w-fit px-6 py-2.5")}
            </div>
          </div>
        </div>
      ) : coverLayout === 2 ? (
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <ThemeLogo className="w-full" insideSurface themeConfig={themeConfig} />
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="order-2 flex w-full flex-1 flex-col gap-4 md:order-1">
              <div className={coverTitleClassName} style={coverTitleStyle}>
                {titleContent}
              </div>
              <div
                className={coverCaptionClassName}
                style={{ ...coverCaptionStyle, opacity: 0.65 }}
              >
                {descriptionContent}
              </div>
              {renderStartButton("w-fit px-6 py-2.5")}
            </div>
            <div className="order-1 w-full shrink-0 md:order-2 md:w-1/2">
              <CoverImagePreview
                coverHeroImage={coverHeroImage}
                themeConfig={themeConfig}
              />
            </div>
          </div>
        </div>
      ) : coverLayout === 3 ? (
        <div className="relative z-10 flex w-full max-w-lg flex-col gap-4 text-center">
          <ThemeLogo className="w-full" insideSurface themeConfig={themeConfig} />
          <div className="flex flex-col items-center gap-3 text-center">
            {coverHeroImage ? (
              <img
                src={coverHeroImage}
                alt="Cover"
                className="mb-1 h-24 w-24 rounded-xl object-cover"
              />
            ) : null}
            <div
              className={`w-full ${coverTitleClassName}`}
              style={coverTitleStyle}
            >
              {titleContent}
            </div>
            <div
              className={`w-full ${coverCaptionClassName}`}
              style={{
                ...coverCaptionStyle,
                opacity: 0.85,
              }}
            >
              {descriptionContent}
            </div>
            {renderStartButton("mt-2 px-8 py-3")}
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-lg flex-col gap-4 text-center">
          <ThemeLogo className="w-full" insideSurface themeConfig={themeConfig} />
          <div className="flex flex-col items-center gap-3 text-center">
            {coverHeroImage ? (
              <img
                src={coverHeroImage}
                alt="Cover"
                className="mb-1 h-24 w-24 rounded-xl object-cover"
              />
            ) : null}
            <div
              className={`w-full ${coverTitleClassName}`}
              style={coverTitleStyle}
            >
              {titleContent}
            </div>
            <div
              className={`w-full ${coverCaptionClassName}`}
              style={{ ...coverCaptionStyle, opacity: 0.65 }}
            >
              {descriptionContent}
            </div>
            {renderStartButton("mt-2 px-8 py-3")}
          </div>
        </div>
      )}
    </div>
  );
}
