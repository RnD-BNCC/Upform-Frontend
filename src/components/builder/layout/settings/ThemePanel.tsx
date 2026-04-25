import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretUpIcon,
  ImageIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "@phosphor-icons/react";
import { InputPreviewIcon } from "@/components/icons";
import { ensureGoogleFontsLoaded } from "@/utils/form/googleFonts";
import {
  DEFAULT_THEME_FORM_IMAGE_URL,
  THEMES,
  getThemeByKey,
  getThemeCssVariables,
  resolveTheme,
  serializeCustomTheme,
  type ThemeConfig,
  type ThemeButtonRounding,
  type ThemeFormAlignment,
  type ThemeFormPosition,
  type ThemeInputStyle,
  type ThemeKey,
  type ThemeQuestionSize,
} from "@/utils/form/themeConfig";
import type { FormSection } from "@/types/form";
import { getThemeLogoIconName } from "@/utils/form/themeLogo";
import * as PhosphorIcons from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { ImagePickerModal } from "@/components/modal";
import HelpTooltip from "@/components/builder/layout/shared/HelpTooltip";
import ThemeFontPickerModal from "./ThemeFontPickerModal";

type Props = {
  activeTheme: string;
  pageType?: FormSection["pageType"];
  onThemeChange: (theme: string) => void;
  onClose: () => void;
};

type EditableThemeConfig = Pick<
  ThemeConfig,
  | "backButtonPosition"
  | "bg"
  | "boldLabels"
  | "buttonAnimation"
  | "buttonRounding"
  | "btnBg"
  | "canvasBg"
  | "fieldSpacing"
  | "fontCategory"
  | "fontKey"
  | "formAlignment"
  | "formImagePositionX"
  | "formImagePositionY"
  | "formImageUrl"
  | "formPosition"
  | "formWidth"
  | "inputBg"
  | "inputBorder"
  | "inputStyle"
  | "inputText"
  | "logoEnabled"
  | "logoUrl"
  | "questionSize"
  | "textColor"
>;

const fieldLabelClassName = "text-xs font-medium leading-5 text-gray-600";
const segmentedButtonClassName =
  "flex h-9 flex-1 items-center justify-center px-3 text-xs font-medium transition-colors";
const advancedSegmentIdleClassName =
  "text-gray-500 hover:bg-gray-50 hover:text-gray-700";
const advancedSegmentSelectedClassName =
  "relative z-10 bg-white text-gray-900 shadow-[inset_0_0_0_1px_#111827]";

function getSegmentRadiusClassName(index: number, total: number) {
  if (total <= 1) return "rounded-lg";
  if (index === 0) return "rounded-l-lg";
  if (index === total - 1) return "rounded-r-lg";
  return "";
}

const FORM_POSITION_OPTIONS: Array<{
  label: string;
  value: ThemeFormPosition;
}> = [
  { label: "Centered form", value: "center" },
  { label: "Image left", value: "image-left" },
  { label: "Image right", value: "image-right" },
  { label: "Image top", value: "image-top" },
  { label: "Image background", value: "image-background" },
  { label: "Image bottom", value: "image-bottom" },
];

const QUESTION_SIZE_OPTIONS: Array<{
  label: string;
  value: ThemeQuestionSize;
}> = [
  { label: "Small", value: "small" },
  { label: "Normal", value: "normal" },
  { label: "Large", value: "large" },
];

const INPUT_STYLE_OPTIONS: Array<{
  label: string;
  value: ThemeInputStyle;
}> = [
  { label: "Default", value: "default" },
  { label: "Underline", value: "underline" },
  { label: "Rounded", value: "rounded" },
];

const BUTTON_ROUNDING_OPTIONS: Array<{
  label: string;
  value: ThemeButtonRounding;
}> = [
  { label: "Default", value: "default" },
  { label: "Full", value: "full" },
  { label: "None", value: "none" },
];

const FORM_ALIGNMENT_OPTIONS: Array<{
  label: string;
  value: ThemeFormAlignment;
}> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
];

function buildEditableThemeConfig(theme: ThemeConfig): EditableThemeConfig {
  return {
    backButtonPosition: theme.backButtonPosition,
    bg: theme.bg,
    boldLabels: theme.boldLabels,
    buttonAnimation: theme.buttonAnimation,
    buttonRounding: theme.buttonRounding,
    btnBg: theme.btnBg,
    canvasBg: theme.canvasBg,
    fieldSpacing: theme.fieldSpacing,
    formAlignment: theme.formAlignment,
    formImagePositionX: theme.formImagePositionX,
    formImagePositionY: theme.formImagePositionY,
    formImageUrl: theme.formImageUrl,
    formPosition: theme.formPosition,
    formWidth: theme.formWidth,
    fontCategory: theme.fontCategory,
    fontKey: theme.fontKey,
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

function ThemePreviewCard({
  isCurrent,
  theme,
  onClick,
  onEdit,
}: {
  isCurrent: boolean;
  theme: ThemeConfig;
  onClick?: () => void;
  onEdit: () => void;
}) {
  const themeVars = getThemeCssVariables(theme);

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`upform-theme-scope upform-theme-card-preview w-full overflow-hidden rounded-md border text-left shadow-sm transition-all ${
        isCurrent
          ? "border-primary-500"
          : "border-gray-200 hover:border-gray-300"
      }`}
      style={{
        ...themeVars,
        background: "var(--upform-theme-canvas-bg)",
      }}
    >
      <div
        className="flex h-8 items-center justify-between gap-2 border-b px-3"
        style={{ borderBottomColor: "var(--upform-theme-answer-border)" }}
      >
        <p className="theme-question-title truncate text-[13px] font-semibold leading-5">
          {theme.label}
        </p>
        {isCurrent ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="h-6 rounded-md bg-gray-900 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="theme-answer-input flex h-8 min-w-0 flex-1 items-center gap-2 rounded-sm border px-2.5 text-[11px]">
          <InputPreviewIcon style={{ flexShrink: 0 }} />
          <span className="truncate">Text</span>
        </div>
        <div
          className="theme-primary-button h-7 w-9 shrink-0 rounded-md"
          style={{
            background: "var(--upform-theme-primary)",
          }}
        />
      </div>
    </div>
  );
}

function ThemeColorField({
  description,
  label,
  title,
  value,
  onChange,
}: {
  description?: string;
  label: string;
  title?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={fieldLabelClassName}>{label}</span>
          {title ? <HelpTooltip>{title}</HelpTooltip> : null}
        </div>
        {description ? (
          <p className="mt-0.5 text-xs leading-4 text-gray-400">{description}</p>
        ) : null}
      </div>

      <div className="shrink-0">
        <input
          id={inputId}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          className="flex h-9 w-16 cursor-pointer items-center justify-center rounded-sm border border-gray-200 bg-white p-1.5 transition-colors hover:border-gray-300"
          title={`Pick ${label.toLowerCase()} color`}
        >
          <span
            className="block h-full w-full rounded-sm"
            style={{ background: value }}
          />
        </label>
      </div>
    </div>
  );
}

function ThemeRangeField({
  label,
  max,
  min,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <label className="block space-y-5">
      <span className={fieldLabelClassName}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-300 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        style={{
          background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${percent}%, #d1d5db ${percent}%, #d1d5db 100%)`,
        }}
      />
    </label>
  );
}

function ThemeToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
        checked ? "bg-primary-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function FormPositionIcon({
  isSelected,
  value,
}: {
  isSelected: boolean;
  value: ThemeFormPosition;
}) {
  const formClassName = isSelected ? "bg-primary-300" : "bg-gray-200";
  const imageClassName = isSelected ? "bg-primary-100" : "bg-gray-100";

  return (
    <span className="relative block h-9 w-full overflow-hidden rounded-sm border border-gray-200 bg-white">
      {value === "center" ? (
        <span className={`absolute inset-1 rounded-[3px] ${formClassName}`} />
      ) : null}
      {value === "image-left" ? (
        <>
          <span className={`absolute inset-y-0 left-0 w-5 ${imageClassName}`} />
          <span className={`absolute inset-y-1 right-1 w-7 rounded-[3px] ${formClassName}`} />
        </>
      ) : null}
      {value === "image-right" ? (
        <>
          <span className={`absolute inset-y-1 left-1 w-7 rounded-[3px] ${formClassName}`} />
          <span className={`absolute inset-y-0 right-0 w-5 ${imageClassName}`} />
        </>
      ) : null}
      {value === "image-top" ? (
        <>
          <span className={`absolute inset-x-0 top-0 h-3 ${imageClassName}`} />
          <span className={`absolute bottom-1 left-1/2 h-5 w-7 -translate-x-1/2 rounded-[3px] ${formClassName}`} />
        </>
      ) : null}
      {value === "image-background" ? (
        <>
          <span className={`absolute inset-0 ${imageClassName}`} />
          <span className={`absolute left-1/2 top-1/2 h-5 w-7 -translate-x-1/2 -translate-y-1/2 rounded-[3px] ${formClassName}`} />
        </>
      ) : null}
      {value === "image-bottom" ? (
        <>
          <span className={`absolute left-1/2 top-1 h-5 w-7 -translate-x-1/2 rounded-[3px] ${formClassName}`} />
          <span className={`absolute inset-x-0 bottom-0 h-3 ${imageClassName}`} />
        </>
      ) : null}
    </span>
  );
}

function InputStylePreview({
  isSelected,
  value,
}: {
  isSelected: boolean;
  value: ThemeInputStyle;
}) {
  const previewClassName =
    value === "underline"
      ? "rounded-none border-x-0 border-t-0"
      : value === "rounded"
        ? "rounded-full"
        : "rounded-sm";

  return (
    <span
      className={`block h-5 w-16 border ${
        isSelected ? "border-primary-500" : "border-gray-400"
      } bg-white ${previewClassName}`}
    />
  );
}

function ButtonRoundingPreview({
  isSelected,
  value,
}: {
  isSelected: boolean;
  value: ThemeButtonRounding;
}) {
  const previewClassName =
    value === "full"
      ? "rounded-full"
      : value === "none"
        ? "rounded-none"
        : "rounded-sm";

  return (
    <span
      className={`block h-5 w-12 border ${
        isSelected ? "border-primary-500" : "border-gray-400"
      } bg-white ${previewClassName}`}
    />
  );
}

function ThemeAdvancedSection({
  children,
  isOpen,
  title,
  onToggle,
}: {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  onToggle: () => void;
}) {
  return (
    <section className="border-t border-gray-100">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
      >
        <span className="text-xs font-semibold uppercase leading-none tracking-wider text-gray-700">
          {title}
        </span>
        {isOpen ? (
          <CaretUpIcon size={12} className="shrink-0 text-gray-400" />
        ) : (
          <CaretDownIcon size={12} className="shrink-0 text-gray-400" />
        )}
      </button>
      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}

export default function ThemePanel({
  activeTheme,
  pageType = "page",
  onThemeChange,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"current" | "all">("all");
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [isAdvancedDesignerOpen, setIsAdvancedDesignerOpen] = useState(false);
  const [advancedSectionsOpen, setAdvancedSectionsOpen] = useState({
    buttons: true,
    inputs: true,
    layout: true,
  });
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const [isFormImagePickerOpen, setIsFormImagePickerOpen] = useState(false);

  const resolvedTheme = useMemo(() => resolveTheme(activeTheme), [activeTheme]);
  const currentTheme = resolvedTheme.config;

  const persistCustomTheme = (sourceKey: ThemeKey, theme: ThemeConfig) => {
    onThemeChange(serializeCustomTheme(sourceKey, buildEditableThemeConfig(theme)));
  };

  useEffect(() => {
    ensureGoogleFontsLoaded([
      {
        key: currentTheme.fontKey,
        label: currentTheme.fontKey,
        family: currentTheme.fontFamily,
        category: currentTheme.fontCategory,
      },
    ]);
  }, [
    currentTheme.fontCategory,
    currentTheme.fontFamily,
    currentTheme.fontKey,
  ]);

  const applyPreset = (themeKey: ThemeKey) => {
    onThemeChange(themeKey);
    setIsEditingCurrent(false);
  };

  const enterCustomMode = (themeKey?: ThemeKey) => {
    const sourceKey = themeKey ?? resolvedTheme.sourceKey;
    const sourceTheme =
      themeKey != null ? getThemeByKey(themeKey) : resolvedTheme.config;

    persistCustomTheme(sourceKey, sourceTheme);
    setIsEditingCurrent(true);
    setTab("current");
  };

  const updateCurrentCustomTheme = (
    updater: (theme: ThemeConfig) => ThemeConfig,
  ) => {
    const nextTheme = updater(currentTheme);
    persistCustomTheme(resolvedTheme.sourceKey, nextTheme);
  };
  const toggleAdvancedSection = (section: keyof typeof advancedSectionsOpen) => {
    setAdvancedSectionsOpen((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };
  const logoIconName = getThemeLogoIconName(currentTheme.logoUrl);
  const LogoIcon =
    logoIconName && logoIconName in PhosphorIcons
      ? (PhosphorIcons[logoIconName as keyof typeof PhosphorIcons] as Icon)
      : null;

  const currentCard = (
    <div className="space-y-4">
      {!resolvedTheme.isCustom ? (
        <div onClick={() => setIsEditingCurrent(false)}>
          <ThemePreviewCard
            isCurrent
            theme={currentTheme}
            onEdit={() => {
              enterCustomMode();
            }}
          />
        </div>
      ) : null}

      {isEditingCurrent || resolvedTheme.isCustom ? (
        <div className="space-y-5 px-1 py-1">
          <ThemeColorField
            label="Background"
            value={currentTheme.canvasBg}
            onChange={(value) =>
              updateCurrentCustomTheme((theme) => ({
                ...theme,
                canvasBg: value,
              }))
            }
          />
          <ThemeColorField
            label="Questions background"
            value={currentTheme.bg}
            onChange={(value) =>
              updateCurrentCustomTheme((theme) => ({
                ...theme,
                bg: value,
              }))
            }
          />
          <ThemeColorField
            label="Primary"
            title="Default color for buttons and other primary elements."
            value={currentTheme.btnBg}
            onChange={(value) =>
              updateCurrentCustomTheme((theme) => ({
                ...theme,
                btnBg: value,
              }))
            }
          />
          <ThemeColorField
            label="Questions"
            description="Title and caption colors."
            value={currentTheme.textColor}
            onChange={(value) =>
              updateCurrentCustomTheme((theme) => ({
                ...theme,
                textColor: value,
              }))
            }
          />
          <ThemeColorField
            label="Answers"
            description="Border, placeholder, and default answer colors."
            value={currentTheme.inputText}
            onChange={(value) =>
              updateCurrentCustomTheme((theme) => ({
                ...theme,
                inputBorder: value,
                inputText: value,
              }))
            }
          />

          <label className="block space-y-1.5">
            <span className={fieldLabelClassName}>Font</span>
            <button
              type="button"
              onClick={() => {
                if (!resolvedTheme.isCustom) {
                  enterCustomMode();
                }
                setIsFontPickerOpen(true);
              }}
              className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-left text-xs text-gray-700 outline-none transition-colors hover:border-gray-300"
            >
              <span className="text-base leading-none text-gray-500">Aa</span>
              <span
                className="truncate text-xs font-medium"
                style={{ fontFamily: currentTheme.fontFamily }}
              >
                {currentTheme.fontKey}
              </span>
            </button>
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className={fieldLabelClassName}>Logo</span>
                <HelpTooltip>
                  {
                    <>
                      Add a logo to the top of your form. For best results, use a
                      logo that is wider than it is tall.
                    </>
                  }
                </HelpTooltip>
              </div>
              <ThemeToggle
                checked={currentTheme.logoEnabled}
                onChange={(checked) =>
                  updateCurrentCustomTheme((theme) => ({
                    ...theme,
                    logoEnabled: checked,
                  }))
                }
              />
            </div>

            {currentTheme.logoEnabled ? (
              <div className="space-y-2">
                {currentTheme.logoUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 min-w-12 items-center justify-center">
                      {LogoIcon ? (
                        <LogoIcon size={42} className="text-gray-200" />
                      ) : (
                        <img
                          src={currentTheme.logoUrl}
                          alt="Logo preview"
                          className="h-10 max-w-20 object-contain"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLogoPickerOpen(true)}
                      className="h-9 rounded-sm border border-gray-200 bg-white px-4 text-xs font-medium text-gray-900 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLogoPickerOpen(true)}
                    className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                  >
                    <ImageIcon size={13} />
                    Add logo
                  </button>
                )}
              </div>
            ) : null}

            {pageType === "page" ? (
              <div className="space-y-3">
                <span className={fieldLabelClassName}>Position</span>
                <div className="grid grid-cols-3 gap-2">
                  {FORM_POSITION_OPTIONS.map((option) => {
                    const isSelected = currentTheme.formPosition === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        title={option.label}
                        onClick={() =>
                          updateCurrentCustomTheme((theme) => ({
                            ...theme,
                            formImageUrl:
                              option.value === "center"
                                ? theme.formImageUrl
                                : theme.formImageUrl ??
                                  DEFAULT_THEME_FORM_IMAGE_URL,
                            formPosition: option.value,
                          }))
                        }
                        className={`rounded-sm border p-1.5 transition-colors ${
                          isSelected
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <FormPositionIcon
                          isSelected={isSelected}
                          value={option.value}
                        />
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormImagePickerOpen(true)}
                  className="flex h-9 items-center gap-2 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <ImageIcon size={13} />
                  {currentTheme.formImageUrl ? "Change image" : "Add image"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <span className={fieldLabelClassName}>Questions</span>
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              {QUESTION_SIZE_OPTIONS.map((option) => {
                const isSelected = currentTheme.questionSize === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateCurrentCustomTheme((theme) => ({
                        ...theme,
                        questionSize: option.value,
                      }))
                    }
                    className={`${segmentedButtonClassName} rounded-md ${
                      isSelected
                        ? "border border-gray-300 bg-white text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={fieldLabelClassName}>Advanced designer</span>
              <HelpTooltip>
                {
                  <>
                    Customize any part of your form with advanced styling options
                    and custom CSS.
                  </>
                }
              </HelpTooltip>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!resolvedTheme.isCustom) {
                  enterCustomMode();
                }
                setTab("current");
                setIsAdvancedDesignerOpen(true);
              }}
              className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontalIcon size={14} className="text-gray-500" />
                Advanced designer
              </span>
              <ArrowRightIcon size={14} weight="bold" className="text-gray-400" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (isAdvancedDesignerOpen) {
    return (
      <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              setIsAdvancedDesignerOpen(false);
              setTab("current");
            }}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 transition-colors hover:text-gray-700"
          >
            <CaretLeftIcon size={14} weight="bold" />
            Back
          </button>
          <span className="text-sm font-semibold text-gray-900">
            Advanced designer
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ThemeAdvancedSection
            isOpen={advancedSectionsOpen.inputs}
            title="Inputs"
            onToggle={() => toggleAdvancedSection("inputs")}
          >
            <div className="space-y-3">
              <p className={fieldLabelClassName}>Style</p>
              <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {INPUT_STYLE_OPTIONS.map((option, index) => {
                  const isSelected = currentTheme.inputStyle === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateCurrentCustomTheme((theme) => ({
                          ...theme,
                          inputStyle: option.value,
                        }))
                      }
                      className={`flex h-20 flex-col items-center justify-center gap-2 border-r border-gray-200 text-xs font-medium transition-colors last:border-r-0 ${getSegmentRadiusClassName(
                        index,
                        INPUT_STYLE_OPTIONS.length,
                      )} ${
                        isSelected
                          ? advancedSegmentSelectedClassName
                          : advancedSegmentIdleClassName
                      }`}
                    >
                      <InputStylePreview
                        isSelected={isSelected}
                        value={option.value}
                      />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className={fieldLabelClassName}>Bold labels</span>
                <ThemeToggle
                  checked={currentTheme.boldLabels}
                  onChange={(checked) =>
                    updateCurrentCustomTheme((theme) => ({
                      ...theme,
                      boldLabels: checked,
                    }))
                  }
                />
              </div>
            </div>
          </ThemeAdvancedSection>

          <ThemeAdvancedSection
            isOpen={advancedSectionsOpen.buttons}
            title="Buttons"
            onToggle={() => toggleAdvancedSection("buttons")}
          >
            <div className="space-y-7">
              <div className="space-y-3">
                <p className={fieldLabelClassName}>Rounding</p>
                <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {BUTTON_ROUNDING_OPTIONS.map((option, index) => {
                    const isSelected =
                      currentTheme.buttonRounding === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateCurrentCustomTheme((theme) => ({
                            ...theme,
                            buttonRounding: option.value,
                          }))
                        }
                        className={`flex h-20 flex-col items-center justify-center gap-2 border-r border-gray-200 text-xs font-medium transition-colors last:border-r-0 ${getSegmentRadiusClassName(
                          index,
                          BUTTON_ROUNDING_OPTIONS.length,
                        )} ${
                          isSelected
                            ? advancedSegmentSelectedClassName
                            : advancedSegmentIdleClassName
                        }`}
                      >
                        <ButtonRoundingPreview
                          isSelected={isSelected}
                          value={option.value}
                        />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </ThemeAdvancedSection>

          <ThemeAdvancedSection
            isOpen={advancedSectionsOpen.layout}
            title="Layout"
            onToggle={() => toggleAdvancedSection("layout")}
          >
            <div className="space-y-8">
              <div className="flex flex-col items-start gap-2">
                <span className={fieldLabelClassName}>Alignment</span>
                <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white">
                  {FORM_ALIGNMENT_OPTIONS.map((option, index) => {
                    const isSelected =
                      currentTheme.formAlignment === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateCurrentCustomTheme((theme) => ({
                            ...theme,
                            formAlignment: option.value,
                          }))
                        }
                        className={`h-9 border-r border-gray-200 px-4 text-xs font-medium transition-colors last:border-r-0 ${getSegmentRadiusClassName(
                          index,
                          FORM_ALIGNMENT_OPTIONS.length,
                        )} ${
                          isSelected
                            ? advancedSegmentSelectedClassName
                            : advancedSegmentIdleClassName
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <ThemeRangeField
                label="Form width"
                min={420}
                max={960}
                step={12}
                value={currentTheme.formWidth}
                onChange={(value) =>
                  updateCurrentCustomTheme((theme) => ({
                    ...theme,
                    formWidth: value,
                  }))
                }
              />

              <ThemeRangeField
                label="Padding between fields"
                min={0}
                max={32}
                step={2}
                value={currentTheme.fieldSpacing}
                onChange={(value) =>
                  updateCurrentCustomTheme((theme) => ({
                    ...theme,
                    fieldSpacing: value,
                  }))
                }
              />
            </div>
          </ThemeAdvancedSection>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4">
        <span className="text-sm font-semibold text-gray-900">Form designer</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-colors hover:text-gray-600"
        >
          <XIcon size={14} weight="bold" />
        </button>
      </div>

      <div className="px-3 py-3">
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          {(["current", "all"] as const).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={`flex h-8 flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors ${
                tab === tabKey
                  ? "bg-slate-600 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tabKey === "current" ? "Current" : "All themes"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {tab === "current" ? (
          currentCard
        ) : (
          <div className="space-y-3">
            {THEMES.map((theme) => {
              const isCurrent =
                !resolvedTheme.isCustom && resolvedTheme.sourceKey === theme.key;

              return (
                <div key={theme.key} className="space-y-2">
                  <ThemePreviewCard
                    isCurrent={isCurrent}
                    theme={theme}
                    onClick={() => applyPreset(theme.key)}
                    onEdit={() => enterCustomMode(theme.key)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ThemeFontPickerModal
        isOpen={isFontPickerOpen}
        selectedFontKey={currentTheme.fontKey}
        onClose={() => setIsFontPickerOpen(false)}
        onSelect={(font) => {
          updateCurrentCustomTheme((theme) => ({
            ...theme,
            fontCategory: font.category,
            fontKey: font.key,
            fontFamily: font.family,
          }));
        }}
      />
      <ImagePickerModal
        isOpen={isLogoPickerOpen}
        showIconTab
        onClose={() => setIsLogoPickerOpen(false)}
        onSelect={(url) => {
          updateCurrentCustomTheme((theme) => ({
            ...theme,
            logoEnabled: true,
            logoUrl: url,
          }));
        }}
      />
      <ImagePickerModal
        isOpen={isFormImagePickerOpen}
        showIconTab={false}
        onClose={() => setIsFormImagePickerOpen(false)}
        onSelect={(url) => {
          updateCurrentCustomTheme((theme) => ({
            ...theme,
            formImageUrl: url,
            formPosition:
              theme.formPosition === "center" ? "image-right" : theme.formPosition,
          }));
        }}
      />
    </div>
  );
}
