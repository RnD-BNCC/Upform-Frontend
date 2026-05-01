export type ThemeKey =
  | "light"
  | "dark"
  | "eco-friendly"
  | "charcoal"
  | "sunset"
  | "ocean"
  | "lavender"
  | "sandstone"
  | "berry";
export type ThemeFontKey = string;
export type ThemeFormPosition =
  | "center"
  | "image-left"
  | "image-right"
  | "image-top"
  | "image-background"
  | "image-bottom";
export type ThemeBackButtonPosition = "top-left" | "near-next-button";
export type ThemeButtonAnimation = "default" | "grow";
export type ThemeButtonRounding = "default" | "full" | "none";
export type ThemeFormAlignment = "left" | "center";
export type ThemeInputStyle = "default" | "underline" | "rounded";
export type ThemeQuestionSize = "small" | "normal" | "large";
export type ThemeFontCategory =
  | "display"
  | "handwriting"
  | "monospace"
  | "sans-serif"
  | "serif"
  | string;

export type ThemeFontOption = {
  key: ThemeFontKey;
  category: ThemeFontCategory;
  family: string;
  label: string;
};

export const DEFAULT_THEME_FORM_IMAGE_URL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80";

export type ThemeConfig = {
  key: ThemeKey;
  label: string;
  backButtonPosition: ThemeBackButtonPosition;
  canvasBg: string;
  bg: string;
  boldLabels: boolean;
  buttonAnimation: ThemeButtonAnimation;
  buttonRounding: ThemeButtonRounding;
  fieldSpacing: number;
  formAlignment: ThemeFormAlignment;
  formWidth: number;
  inputBg: string;
  inputBorder: string;
  inputStyle: ThemeInputStyle;
  btnBg: string;
  textColor: string;
  inputText: string;
  fontKey: ThemeFontKey;
  fontCategory: ThemeFontCategory;
  fontFamily: string;
  formImageUrl: string | null;
  formImagePositionX: number;
  formImagePositionY: number;
  formPosition: ThemeFormPosition;
  logoEnabled: boolean;
  logoUrl: string | null;
  questionSize: ThemeQuestionSize;
};

export type ThemeCustomConfig = Pick<
  ThemeConfig,
  | "backButtonPosition"
  | "bg"
  | "boldLabels"
  | "buttonAnimation"
  | "buttonRounding"
  | "fieldSpacing"
  | "btnBg"
  | "canvasBg"
  | "fontKey"
  | "formImageUrl"
  | "formImagePositionX"
  | "formImagePositionY"
  | "formAlignment"
  | "formPosition"
  | "formWidth"
  | "fontCategory"
  | "inputBg"
  | "inputBorder"
  | "inputStyle"
  | "inputText"
  | "logoEnabled"
  | "logoUrl"
  | "questionSize"
  | "textColor"
>;

type CustomThemePayload = {
  mode: "custom";
  sourceKey: ThemeKey;
  config: Partial<ThemeCustomConfig>;
};

export type ResolvedTheme = {
  config: ThemeConfig;
  isCustom: boolean;
  sourceKey: ThemeKey;
  value: string;
};

export const THEME_FONTS: ThemeFontOption[] = [
  {
    key: "Montserrat",
    category: "sans-serif",
    family: '"Montserrat", sans-serif',
    label: "Montserrat",
  },
  {
    key: "Inter",
    category: "sans-serif",
    family: '"Inter", sans-serif',
    label: "Inter",
  },
  {
    key: "Roboto",
    category: "sans-serif",
    family: '"Roboto", sans-serif',
    label: "Roboto",
  },
  {
    key: "Open Sans",
    category: "sans-serif",
    family: '"Open Sans", sans-serif',
    label: "Open Sans",
  },
  {
    key: "Lora",
    category: "serif",
    family: '"Lora", serif',
    label: "Lora",
  },
  {
    key: "Playfair Display",
    category: "serif",
    family: '"Playfair Display", serif',
    label: "Playfair Display",
  },
  {
    key: "Space Grotesk",
    category: "sans-serif",
    family: '"Space Grotesk", sans-serif',
    label: "Space Grotesk",
  },
  {
    key: "Fira Mono",
    category: "monospace",
    family: '"Fira Mono", monospace',
    label: "Fira Mono",
  },
  {
    key: "System",
    category: "sans-serif",
    family:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    label: "System",
  },
  {
    key: "Serif",
    category: "serif",
    family: 'Georgia, "Times New Roman", serif',
    label: "Serif",
  },
  {
    key: "Mono",
    category: "monospace",
    family: '"Courier New", monospace',
    label: "Mono",
  },
];

const DEFAULT_FONT = THEME_FONTS[0];

type ThemePresetConfig = Omit<
  ThemeConfig,
  "fontFamily" | "formImagePositionX" | "formImagePositionY"
> &
  Partial<Pick<ThemeConfig, "formImagePositionX" | "formImagePositionY">>;

const THEME_PRESETS: ThemePresetConfig[] = [
  {
    key: "light",
    label: "Light",
    backButtonPosition: "top-left",
    canvasBg: "#f5f5f5",
    bg: "#ffffff",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#ffffff",
    inputBorder: "#d1d5db",
    inputStyle: "default",
    btnBg: "#0054a5",
    textColor: "#111827",
    inputText: "#6b7280",
    fontKey: "Montserrat",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "dark",
    label: "Dark",
    backButtonPosition: "top-left",
    canvasBg: "#111827",
    bg: "#1a1a2e",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#16213e",
    inputBorder: "#374151",
    inputStyle: "default",
    btnBg: "#3b82f6",
    textColor: "#f9fafb",
    inputText: "#9ca3af",
    fontKey: "Montserrat",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "eco-friendly",
    label: "Eco-friendly",
    backButtonPosition: "top-left",
    canvasBg: "#e8eee8",
    bg: "#f0f4f0",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#ffffff",
    inputBorder: "#86efac",
    inputStyle: "default",
    btnBg: "#16a34a",
    textColor: "#14532d",
    inputText: "#4b7c5a",
    fontKey: "Montserrat",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "charcoal",
    label: "Charcoal",
    backButtonPosition: "top-left",
    canvasBg: "#2d3748",
    bg: "#374151",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#1f2937",
    inputBorder: "#4b5563",
    inputStyle: "default",
    btnBg: "#111827",
    textColor: "#f9fafb",
    inputText: "#9ca3af",
    fontKey: "Montserrat",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "sunset",
    label: "Sunset",
    backButtonPosition: "top-left",
    canvasBg: "#fff1e6",
    bg: "#fff8f1",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#ffffff",
    inputBorder: "#f4a261",
    inputStyle: "default",
    btnBg: "#f97316",
    textColor: "#431407",
    inputText: "#9a3412",
    fontKey: "Space Grotesk",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "ocean",
    label: "Ocean",
    backButtonPosition: "top-left",
    canvasBg: "#e0f2fe",
    bg: "#f0f9ff",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#ffffff",
    inputBorder: "#38bdf8",
    inputStyle: "default",
    btnBg: "#0284c7",
    textColor: "#0c4a6e",
    inputText: "#0369a1",
    fontKey: "Open Sans",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "lavender",
    label: "Lavender",
    backButtonPosition: "top-left",
    canvasBg: "#f3e8ff",
    bg: "#fbf7ff",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#ffffff",
    inputBorder: "#c084fc",
    inputStyle: "default",
    btnBg: "#7c3aed",
    textColor: "#3b0764",
    inputText: "#7e22ce",
    fontKey: "Lora",
    fontCategory: "serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "sandstone",
    label: "Sandstone",
    backButtonPosition: "top-left",
    canvasBg: "#f5efe6",
    bg: "#fffaf2",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#fffefd",
    inputBorder: "#d6b48c",
    inputStyle: "default",
    btnBg: "#a16207",
    textColor: "#422006",
    inputText: "#92400e",
    fontKey: "Playfair Display",
    fontCategory: "serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
  {
    key: "berry",
    label: "Berry",
    backButtonPosition: "top-left",
    canvasBg: "#2a0f1f",
    bg: "#3b102b",
    boldLabels: false,
    buttonAnimation: "default",
    buttonRounding: "default",
    fieldSpacing: 8,
    formAlignment: "center",
    formWidth: 672,
    inputBg: "#4a1635",
    inputBorder: "#be185d",
    inputStyle: "default",
    btnBg: "#ec4899",
    textColor: "#fff1f7",
    inputText: "#f9a8d4",
    fontKey: "Montserrat",
    fontCategory: "sans-serif",
    formImageUrl: null,
    formPosition: "center",
    logoEnabled: false,
    logoUrl: null,
    questionSize: "normal",
  },
];

export function getThemeQuestionSizeStyles(questionSize: ThemeQuestionSize) {
  switch (questionSize) {
    case "small":
      return {
        captionLineHeight: "1.25rem",
        captionSize: "0.75rem",
        titleLineHeight: "1.375rem",
        titleSize: "0.875rem",
      };
    case "large":
      return {
        captionLineHeight: "1.75rem",
        captionSize: "1.125rem",
        titleLineHeight: "2.25rem",
        titleSize: "1.5rem",
      };
    case "normal":
    default:
      return {
        captionLineHeight: "1.5rem",
        captionSize: "0.9375rem",
        titleLineHeight: "1.75rem",
        titleSize: "1.125rem",
      };
  }
}

export function getThemeFormLayout(position: ThemeFormPosition) {
  return {
    hasImage: position !== "center",
    imagePlacement: position.replace("image-", "") as
      | "left"
      | "right"
      | "top"
      | "background"
      | "bottom",
  };
}

function getThemeInputStyleVars(theme: ThemeConfig) {
  switch (theme.inputStyle) {
    case "underline":
      return {
        background: "transparent",
        borderBottomWidth: "1px",
        borderLeftWidth: "0px",
        borderRadius: "0px",
        multilineBorderRadius: "0px",
        borderRightWidth: "0px",
        borderTopWidth: "0px",
      };
    case "rounded":
      return {
        background: theme.inputBg,
        borderBottomWidth: "1px",
        borderLeftWidth: "1px",
        borderRadius: "9999px",
        multilineBorderRadius: "1rem",
        borderRightWidth: "1px",
        borderTopWidth: "1px",
      };
    case "default":
    default:
      return {
        background: theme.inputBg,
        borderBottomWidth: "1px",
        borderLeftWidth: "1px",
        borderRadius: "0.5rem",
        multilineBorderRadius: "0.5rem",
        borderRightWidth: "1px",
        borderTopWidth: "1px",
      };
  }
}

function getThemeButtonRadius(buttonRounding: ThemeButtonRounding) {
  switch (buttonRounding) {
    case "full":
      return "9999px";
    case "none":
      return "0px";
    case "default":
    default:
      return "0.5rem";
  }
}

export function buildThemeFontFamily(
  fontKey?: ThemeFontKey,
  fontCategory?: ThemeFontCategory,
) {
  if (!fontKey) {
    return DEFAULT_FONT.family;
  }

  if (fontKey === "System") {
    return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }

  if (fontKey === "Serif") {
    return 'Georgia, "Times New Roman", serif';
  }

  if (fontKey === "Mono") {
    return '"Courier New", monospace';
  }

  const fallback =
    fontCategory === "serif"
      ? "serif"
      : fontCategory === "monospace"
        ? "monospace"
        : fontCategory === "handwriting"
          ? "cursive"
          : "sans-serif";

  return `"${fontKey}", ${fallback}`;
}

function getThemeFont(
  fontKey?: ThemeFontKey,
  fontCategory?: ThemeFontCategory,
) {
  const matchedFont = THEME_FONTS.find((font) => font.key === fontKey);
  if (matchedFont) {
    return matchedFont;
  }

  return {
    category: fontCategory ?? DEFAULT_FONT.category,
    family: buildThemeFontFamily(fontKey, fontCategory),
    key: fontKey ?? DEFAULT_FONT.key,
    label: fontKey ?? DEFAULT_FONT.label,
  } satisfies ThemeFontOption;
}

function createThemeConfig(preset: ThemePresetConfig): ThemeConfig {
  return {
    ...preset,
    fontFamily: getThemeFont(preset.fontKey, preset.fontCategory).family,
    formImagePositionX: preset.formImagePositionX ?? 50,
    formImagePositionY: preset.formImagePositionY ?? 50,
  };
}

export const THEMES: ThemeConfig[] = THEME_PRESETS.map(createThemeConfig);

export function getThemeCustomConfig(theme: ThemeConfig): ThemeCustomConfig {
  return {
    backButtonPosition: theme.backButtonPosition,
    bg: theme.bg,
    boldLabels: theme.boldLabels,
    buttonAnimation: theme.buttonAnimation,
    buttonRounding: theme.buttonRounding,
    btnBg: theme.btnBg,
    canvasBg: theme.canvasBg,
    fieldSpacing: theme.fieldSpacing,
    fontCategory: theme.fontCategory,
    fontKey: theme.fontKey,
    formAlignment: theme.formAlignment,
    formImagePositionX: theme.formImagePositionX,
    formImagePositionY: theme.formImagePositionY,
    formImageUrl: theme.formImageUrl,
    formPosition: theme.formPosition,
    formWidth: theme.formWidth,
    inputBg: theme.inputBg,
    inputBorder: theme.inputBorder,
    inputStyle: theme.inputStyle,
    inputText: theme.inputText,
    logoEnabled: theme.logoEnabled,
    logoUrl: theme.logoUrl,
    questionSize: theme.questionSize,
    textColor: theme.textColor,
  };
}

export function getThemeImagePosition(theme: ThemeConfig) {
  return `${theme.formImagePositionX}% ${theme.formImagePositionY}%`;
}

function parseHexColor(color: string) {
  if (!color.startsWith("#")) {
    return null;
  }

  const hex = color.slice(1);
  if (hex.length === 3) {
    const [r, g, b] = hex.split("");
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }

  if (hex.length === 6) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  return null;
}

function withAlpha(color: string, alpha: number) {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getContrastTextColor(color: string) {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return "#ffffff";
  }

  const luminance =
    (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  return luminance >= 148 ? "#111827" : "#ffffff";
}

function isThemePayload(value: unknown): value is CustomThemePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CustomThemePayload>;
  return payload.mode === "custom" && typeof payload.sourceKey === "string";
}

function normalizeThemeFormPosition(
  value?: string | null,
): ThemeFormPosition | undefined {
  switch (value) {
    case "center":
    case "image-left":
    case "image-right":
    case "image-top":
    case "image-background":
    case "image-bottom":
      return value;
    default:
      return undefined;
  }
}

function normalizeThemeFormAlignment(
  value?: string | null,
): ThemeFormAlignment | undefined {
  switch (value) {
    case "left":
    case "center":
      return value;
    default:
      return undefined;
  }
}

function normalizeThemeNumber(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(max, Math.max(min, value));
}

export function isThemeKey(value: string): value is ThemeKey {
  return THEMES.some((theme) => theme.key === value);
}

export function getThemeByKey(themeKey: ThemeKey) {
  return THEMES.find((theme) => theme.key === themeKey) ?? THEMES[0];
}

export function serializeCustomTheme(
  sourceKey: ThemeKey,
  config: Partial<ThemeCustomConfig>,
) {
  return JSON.stringify({
    mode: "custom",
    sourceKey,
    config,
  } satisfies CustomThemePayload);
}

export function resolveTheme(themeValue?: string | null): ResolvedTheme {
  const fallback = getThemeByKey("light");

  if (!themeValue) {
    return {
      config: fallback,
      isCustom: false,
      sourceKey: fallback.key,
      value: fallback.key,
    };
  }

  if (isThemeKey(themeValue)) {
    const preset = getThemeByKey(themeValue);
    return {
      config: preset,
      isCustom: false,
      sourceKey: preset.key,
      value: preset.key,
    };
  }

  try {
    const parsed = JSON.parse(themeValue) as unknown;
    if (isThemePayload(parsed) && isThemeKey(parsed.sourceKey)) {
      const sourceTheme = getThemeByKey(parsed.sourceKey);
      const customConfig = parsed.config;
      const fontKey =
        customConfig.fontKey &&
        getThemeFont(customConfig.fontKey, customConfig.fontCategory).key;
      const fontCategory =
        customConfig.fontCategory ??
        getThemeFont(customConfig.fontKey, customConfig.fontCategory).category;

      const nextConfig: ThemeConfig = {
        ...sourceTheme,
        ...customConfig,
        backButtonPosition:
          customConfig.backButtonPosition ?? sourceTheme.backButtonPosition,
        fontKey: fontKey ?? sourceTheme.fontKey,
        fontCategory: fontCategory ?? sourceTheme.fontCategory,
        fontFamily: getThemeFont(
          (fontKey ?? sourceTheme.fontKey) as ThemeFontKey,
          (fontCategory ?? sourceTheme.fontCategory) as ThemeFontCategory,
        ).family,
        formImageUrl: customConfig.formImageUrl ?? sourceTheme.formImageUrl,
        formImagePositionX:
          normalizeThemeNumber(customConfig.formImagePositionX, 0, 100) ??
          sourceTheme.formImagePositionX,
        formImagePositionY:
          normalizeThemeNumber(customConfig.formImagePositionY, 0, 100) ??
          sourceTheme.formImagePositionY,
        formAlignment:
          normalizeThemeFormAlignment(customConfig.formAlignment) ??
          sourceTheme.formAlignment,
        formPosition:
          normalizeThemeFormPosition(customConfig.formPosition) ??
          sourceTheme.formPosition,
        formWidth:
          normalizeThemeNumber(customConfig.formWidth, 420, 960) ??
          sourceTheme.formWidth,
        fieldSpacing:
          normalizeThemeNumber(customConfig.fieldSpacing, 0, 32) ??
          sourceTheme.fieldSpacing,
        boldLabels: customConfig.boldLabels ?? sourceTheme.boldLabels,
        buttonAnimation:
          customConfig.buttonAnimation ?? sourceTheme.buttonAnimation,
        buttonRounding: customConfig.buttonRounding ?? sourceTheme.buttonRounding,
        inputStyle: customConfig.inputStyle ?? sourceTheme.inputStyle,
        logoEnabled: customConfig.logoEnabled ?? sourceTheme.logoEnabled,
        logoUrl: customConfig.logoUrl ?? sourceTheme.logoUrl,
        questionSize: customConfig.questionSize ?? sourceTheme.questionSize,
      };

      return {
        config: nextConfig,
        isCustom: true,
        sourceKey: sourceTheme.key,
        value: themeValue,
      };
    }
  } catch {
    // Ignore malformed theme payloads and fall back to the default preset.
  }

  return {
    config: fallback,
    isCustom: false,
    sourceKey: fallback.key,
    value: fallback.key,
  };
}

export function getThemeCssVariables(theme: ThemeConfig) {
  const questionSize = getThemeQuestionSizeStyles(theme.questionSize);
  const inputStyle = getThemeInputStyleVars(theme);

  return {
    "--upform-theme-answer-bg": inputStyle.background,
    "--upform-theme-answer-addon-bg": withAlpha(theme.inputText, 0.12),
    "--upform-theme-answer-border": theme.inputBorder,
    "--upform-theme-answer-border-bottom-width": inputStyle.borderBottomWidth,
    "--upform-theme-answer-border-left-width": inputStyle.borderLeftWidth,
    "--upform-theme-answer-border-radius": inputStyle.borderRadius,
    "--upform-theme-answer-multiline-radius":
      inputStyle.multilineBorderRadius,
    "--upform-theme-answer-border-right-width": inputStyle.borderRightWidth,
    "--upform-theme-answer-border-top-width": inputStyle.borderTopWidth,
    "--upform-theme-answer-placeholder": withAlpha(theme.inputText, 0.62),
    "--upform-theme-answer-text": theme.inputText,
    "--upform-theme-button-text": getContrastTextColor(theme.btnBg),
    "--upform-theme-button-radius": getThemeButtonRadius(theme.buttonRounding),
    "--upform-theme-button-hover-transform":
      theme.buttonAnimation === "grow" ? "scale(1.03)" : "none",
    "--upform-theme-canvas-bg": theme.canvasBg,
    "--upform-theme-field-gap": `${theme.fieldSpacing}px`,
    "--upform-theme-font-family": theme.fontFamily,
    "--upform-theme-form-width": `${theme.formWidth}px`,
    "--upform-theme-primary": theme.btnBg,
    "--upform-theme-primary-soft": withAlpha(theme.btnBg, 0.12),
    "--upform-theme-question-bg": theme.bg,
    "--upform-theme-question-align": theme.formAlignment,
    "--upform-theme-question-caption": withAlpha(theme.textColor, 0.72),
    "--upform-theme-question-caption-font-weight": theme.boldLabels
      ? "700"
      : "400",
    "--upform-theme-question-caption-line-height": questionSize.captionLineHeight,
    "--upform-theme-question-caption-size": questionSize.captionSize,
    "--upform-theme-question-text": theme.textColor,
    "--upform-theme-question-title-font-weight": theme.boldLabels
      ? "700"
      : "500",
    "--upform-theme-question-title-line-height": questionSize.titleLineHeight,
    "--upform-theme-question-title-size": questionSize.titleSize,
  } as Record<string, string>;
}
