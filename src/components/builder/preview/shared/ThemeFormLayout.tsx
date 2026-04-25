import type { MouseEventHandler, ReactNode, RefObject } from "react";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import {
  getThemeCssVariables,
  getThemeFormLayout,
  getThemeImagePosition,
  type ThemeConfig,
} from "@/utils/form/themeConfig";
import ThemeLogo from "./ThemeLogo";

type Props = {
  children: ReactNode;
  formEndRef?: RefObject<HTMLDivElement | null>;
  pageType: "page" | "ending";
  surfaceClassName: string;
  themeConfig: ThemeConfig;
  onFormClick?: MouseEventHandler<HTMLDivElement>;
  onImagePositionClick?: MouseEventHandler<HTMLButtonElement>;
};

function ThemeImagePanel({
  className = "",
  imagePosition,
  imageUrl,
  onImagePositionClick,
}: {
  className?: string;
  imagePosition: string;
  imageUrl: string;
  onImagePositionClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <div
      className={`group/theme-image relative min-h-72 bg-cover ${className}`.trim()}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: imagePosition,
      }}
    >
      {onImagePositionClick ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onImagePositionClick(event);
          }}
          className="absolute right-4 top-4 z-20 flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 opacity-0 shadow-sm transition-all duration-150 hover:bg-gray-50 group-hover/theme-image:opacity-100"
        >
          <ArrowsLeftRightIcon size={14} />
          Position
        </button>
      ) : null}
    </div>
  );
}

export default function ThemeFormLayout({
  children,
  formEndRef,
  pageType,
  surfaceClassName,
  themeConfig,
  onFormClick,
  onImagePositionClick,
}: Props) {
  const themeVars = getThemeCssVariables(themeConfig);
  const layout = getThemeFormLayout(themeConfig.formPosition);
  const imagePosition = getThemeImagePosition(themeConfig);
  const hasLogo = themeConfig.logoEnabled && !!themeConfig.logoUrl;
  const hasLayoutImage =
    pageType === "page" && layout.hasImage && !!themeConfig.formImageUrl;
  const topPaddingClassName = hasLogo ? "pt-8" : "pt-8";
  const formStack = (
    <div
      className={`mx-auto flex w-full flex-col px-4 pb-6 sm:px-6 sm:pb-8 ${topPaddingClassName}`}
      style={{ maxWidth: `${themeConfig.formWidth}px` }}
      onClick={onFormClick}
    >
      <ThemeLogo className={hasLogo ? "mb-8 w-full" : ""} insideSurface={false} themeConfig={themeConfig} />
      <div
        className={`upform-theme-scope upform-theme-form-surface theme-field-stack ${surfaceClassName}`}
        style={themeVars}
      >
        {children}
      </div>
      {formEndRef ? <div ref={formEndRef} /> : null}
    </div>
  );

  if (!hasLayoutImage || !themeConfig.formImageUrl) {
    return (
      <div className="relative w-full">
        {formStack}
      </div>
    );
  }

  if (layout.imagePlacement === "background") {
    return (
      <div
        className="group/theme-image relative min-h-screen w-full bg-cover"
        style={{
          backgroundImage: `url(${themeConfig.formImageUrl})`,
          backgroundPosition: imagePosition,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        {onImagePositionClick ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onImagePositionClick(event);
            }}
            className="absolute right-4 top-4 z-20 flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 opacity-0 shadow-sm transition-all duration-150 hover:bg-gray-50 group-hover/theme-image:opacity-100"
          >
            <ArrowsLeftRightIcon size={14} />
            Position
          </button>
        ) : null}
        <div className="relative z-10">{formStack}</div>
      </div>
    );
  }

  if (layout.imagePlacement === "top" || layout.imagePlacement === "bottom") {
    const imagePanel = (
      <ThemeImagePanel
        imagePosition={imagePosition}
        imageUrl={themeConfig.formImageUrl}
        onImagePositionClick={onImagePositionClick}
        className="h-52 w-full shrink-0 sm:h-64 lg:h-72"
      />
    );

    return (
      <div className="flex w-full flex-col">
        {layout.imagePlacement === "top" ? imagePanel : null}
        <div className="w-full" style={{ background: themeConfig.bg }}>
          {formStack}
        </div>
        {layout.imagePlacement === "bottom" ? imagePanel : null}
      </div>
    );
  }

  const imagePanel = (
    <ThemeImagePanel
      imagePosition={imagePosition}
      imageUrl={themeConfig.formImageUrl}
      onImagePositionClick={onImagePositionClick}
      className="order-first h-56 min-h-56 w-full shrink-0 lg:sticky lg:top-0 lg:order-none lg:h-screen lg:min-h-screen lg:min-w-0 lg:basis-[40%]"
    />
  );
  const formPanel = (
    <div
      className="flex min-w-0 lg:flex-1 lg:min-h-screen lg:basis-[60%]"
      style={{ background: themeConfig.bg }}
    >
      {formStack}
    </div>
  );

  return (
    <div className="flex w-full flex-col lg:min-h-screen lg:flex-row">
      {layout.imagePlacement === "left" ? imagePanel : null}
      {formPanel}
      {layout.imagePlacement === "right" ? imagePanel : null}
    </div>
  );
}
