import type { ReactNode } from "react";
import type { ThemeConfig } from "@/utils/form/themeConfig";
import ThemeLogo from "@/components/builder/preview/shared/ThemeLogo";

export type CoverPageThemeConfig = Pick<
  ThemeConfig,
  | "bg"
  | "btnBg"
  | "fontFamily"
  | "inputText"
  | "logoEnabled"
  | "logoUrl"
  | "textColor"
>;

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
      className={`relative flex items-center justify-center px-4 py-12 sm:px-8 sm:py-16 ${containerClassName}`}
      style={
        coverLayout === 3 && coverBgImage
          ? {
              backgroundImage: `url(${coverBgImage})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              fontFamily: themeConfig.fontFamily,
            }
          : { background: themeConfig.bg, fontFamily: themeConfig.fontFamily }
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
              <div style={{ color: themeConfig.textColor }}>{titleContent}</div>
              <div style={{ color: themeConfig.textColor, opacity: 0.65 }}>
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
              <div style={{ color: themeConfig.textColor }}>{titleContent}</div>
              <div style={{ color: themeConfig.textColor, opacity: 0.65 }}>
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
            className="w-full"
            style={{ color: coverBgImage ? "#ffffff" : themeConfig.textColor }}
          >
            {titleContent}
          </div>
          <div
            className="w-full"
            style={{
              color: coverBgImage ? "#ffffff" : themeConfig.inputText,
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
            <div className="w-full" style={{ color: themeConfig.textColor }}>
              {titleContent}
            </div>
            <div
              className="w-full"
              style={{ color: themeConfig.textColor, opacity: 0.65 }}
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
