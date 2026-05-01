import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CodeIcon, XIcon } from "@phosphor-icons/react";
import ConditionSelect from "@/components/builder/layout/reference/ConditionSelect";
import ShareToggle from "../components/ShareToggle";
import type { ConditionSelectOption } from "@/components/builder/layout/reference/ConditionSelect";
import type {
  EmbedButtonSize,
  EmbedType,
  PopupWidth,
  ShareToast,
  SliderSide,
} from "@/types/builderShare";

const EMBED_TYPE_OPTIONS: ConditionSelectOption[] = [
  { value: "standard", label: "Standard" },
  { value: "popup", label: "Popup" },
  { value: "fullscreen", label: "Full screen" },
  { value: "slider", label: "Slider" },
];

const WIDTH_UNIT_OPTIONS: ConditionSelectOption[] = [
  { value: "%", label: "%" },
  { value: "px", label: "px" },
];

const BUTTON_SIZE_OPTIONS: ConditionSelectOption[] = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "small", label: "Small" },
];

const POPUP_WIDTH_OPTIONS: ConditionSelectOption[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const SLIDER_SIDE_OPTIONS: ConditionSelectOption[] = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
];

type EmbedSettingsModalProps = {
  publicFormUrl: string;
  onClose: () => void;
  showToast?: ShareToast;
  type: EmbedType;
};

export default function EmbedSettingsModal({
  publicFormUrl,
  onClose,
  showToast,
  type,
}: EmbedSettingsModalProps) {
  const [embedType, setEmbedType] = useState<EmbedType>(type);
  const [autoResize, setAutoResize] = useState(true);
  const [buttonText, setButtonText] = useState("Open form");
  const [buttonColor, setButtonColor] = useState("#3b82f6");
  const [buttonSize, setButtonSize] = useState<EmbedButtonSize>("default");
  const [floatingButton, setFloatingButton] = useState(false);
  const [popupWidth, setPopupWidth] = useState<PopupWidth>("medium");
  const [sliderSide, setSliderSide] = useState<SliderSide>("right");
  const [activePreview, setActivePreview] = useState<"popup" | "slider" | null>(
    null,
  );
  const [width, setWidth] = useState(embedType === "standard" ? "100" : "420");
  const [widthUnit, setWidthUnit] = useState<"%" | "px">(
    embedType === "standard" ? "%" : "px",
  );
  const [previewKey, setPreviewKey] = useState(() => Date.now());

  const openPreview = () => {
    setPreviewKey(Date.now());
    if (embedType === "popup") {
      setActivePreview("popup");
      return;
    }
    if (embedType === "slider") {
      setActivePreview("slider");
      return;
    }
    setActivePreview(null);
  };

  const embedCode = useMemo(() => {
    const resolvedWidth = `${width || "100"}${widthUnit}`;
    const height = autoResize ? "720" : "600";

    if (embedType === "popup" || embedType === "slider") {
      return `<button data-upform-embed="${embedType}" style="background:${buttonColor};color:#fff;border:0;border-radius:999px;padding:10px 18px;font-weight:700;">${buttonText}</button>\n<script src="${window.location.origin}/embed.js" data-form="${publicFormUrl}" data-type="${embedType}"></script>`;
    }

    if (embedType === "fullscreen") {
      return `<iframe src="${publicFormUrl}" width="100%" height="100vh" style="border:0;width:100%;height:100vh;" loading="lazy"></iframe>`;
    }

    return `<iframe src="${publicFormUrl}" width="${resolvedWidth}" height="${height}" style="border:0;width:${resolvedWidth};max-width:100%;" loading="lazy"></iframe>`;
  }, [
    autoResize,
    buttonColor,
    buttonText,
    embedType,
    publicFormUrl,
    width,
    widthUnit,
  ]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      showToast?.("Embed code copied");
    } catch {
      showToast?.("Failed to copy embed code", "error");
    }
  };

  const buttonPadding =
    buttonSize === "large"
      ? "px-6 py-3 text-base"
      : buttonSize === "small"
        ? "px-3 py-1.5 text-xs"
        : "px-4 py-2 text-sm";
  const popupWidthClass =
    popupWidth === "large"
      ? "w-[84%]"
      : popupWidth === "small"
        ? "w-[52%]"
        : "w-[68%]";
  const showLaunchButton = embedType === "popup" || embedType === "slider";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-220 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="relative flex h-[88vh] w-full max-w-6xl overflow-hidden rounded-sm bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close embed settings"
        >
          <XIcon size={20} />
        </button>

        <aside className="flex w-[340px] max-w-[340px] shrink-0 flex-col overflow-hidden border-r border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Embed Settings</h2>

          <div className="mt-6 min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden pr-1">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Embed type
              </label>
              <ConditionSelect
                value={embedType}
                placeholder="Select embed type"
                options={EMBED_TYPE_OPTIONS}
                onChange={(value) => {
                  const nextType = value as EmbedType;
                  setEmbedType(nextType);
                  setActivePreview(null);
                  setPreviewKey(Date.now());
                  if (nextType === "standard") {
                    setWidth("100");
                    setWidthUnit("%");
                  }
                }}
                menuPlacement="auto"
                triggerClassName="rounded-sm"
              />
            </div>

            {embedType === "popup" || embedType === "slider" ? (
              <>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Button text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(event) => setButtonText(event.target.value)}
                    placeholder="Open form"
                    className="h-10 w-full rounded-sm border border-gray-300 px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                  />
                </div>

                <div className="flex min-w-0 items-center justify-between gap-4">
                  <label className="min-w-0 truncate text-sm font-semibold text-gray-600">
                    Button color
                  </label>
                  <label className="relative flex h-8 w-12 cursor-pointer items-center justify-center rounded-sm border border-gray-200 bg-white">
                    <span
                      className="h-4 w-8 rounded-sm"
                      style={{ backgroundColor: buttonColor }}
                    />
                    <input
                      type="color"
                      value={buttonColor}
                      onChange={(event) => setButtonColor(event.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Button color"
                    />
                  </label>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-4">
                  <label className="min-w-0 truncate text-sm font-semibold text-gray-600">
                    Button size
                  </label>
                  <div className="min-w-0 w-32 shrink-0">
                    <ConditionSelect
                      value={buttonSize}
                      placeholder="Default"
                      options={BUTTON_SIZE_OPTIONS}
                      onChange={(value) =>
                        setButtonSize(value as EmbedButtonSize)
                      }
                      menuPlacement="auto"
                      triggerClassName="rounded-sm"
                    />
                  </div>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-gray-600">
                      Floating button
                    </span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">
                      ?
                    </span>
                  </div>
                  <ShareToggle
                    checked={floatingButton}
                    onChange={setFloatingButton}
                  />
                </div>
              </>
            ) : null}

            {embedType === "standard" || embedType === "popup" ? (
              <div className="flex min-w-0 items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-gray-600">
                    Auto-resize height
                  </span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">
                    ?
                  </span>
                </div>
                <ShareToggle checked={autoResize} onChange={setAutoResize} />
              </div>
            ) : null}

            {embedType === "standard" ? (
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  Width
                </label>
                <div className="flex min-w-0">
                  <input
                    type="text"
                    value={width}
                    onChange={(event) =>
                      setWidth(event.target.value.replace(/[^\d.]/g, ""))
                    }
                    className="h-10 min-w-0 flex-1 rounded-l-sm border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                  />
                  <div className="min-w-0 w-20 shrink-0">
                    <ConditionSelect
                      value={widthUnit}
                      placeholder="%"
                      options={WIDTH_UNIT_OPTIONS}
                      onChange={(value) => setWidthUnit(value as "%" | "px")}
                      menuPlacement="auto"
                      triggerClassName="h-10 rounded-l-none rounded-r-sm border-l-0"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {embedType === "popup" ? (
              <div className="flex min-w-0 items-center justify-between gap-4">
                <label className="min-w-0 truncate text-sm font-semibold text-gray-600">
                  Popup width
                </label>
                <div className="min-w-0 w-36 shrink-0">
                  <ConditionSelect
                    value={popupWidth}
                    placeholder="Medium"
                    options={POPUP_WIDTH_OPTIONS}
                    onChange={(value) => setPopupWidth(value as PopupWidth)}
                    menuPlacement="auto"
                    triggerClassName="rounded-sm"
                  />
                </div>
              </div>
            ) : null}

            {embedType === "slider" ? (
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Slider side
                </label>
                <div className="min-w-0 w-full">
                  <ConditionSelect
                    value={sliderSide}
                    placeholder="Right"
                    options={SLIDER_SIDE_OPTIONS}
                    onChange={(value) => setSliderSide(value as SliderSide)}
                    menuPlacement="auto"
                    triggerClassName="rounded-sm"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-auto min-w-0 space-y-3 pt-3">
            <button
              type="button"
              onClick={copyCode}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-gray-900 text-sm font-bold text-white transition-colors hover:bg-gray-800"
            >
              <CodeIcon size={18} weight="bold" />
              Get the code
            </button>
            <p className="text-center text-xs text-gray-400">
              Preview below uses the live respondent form.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-gray-50 px-8 py-10">
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-sm bg-gray-200 p-6">
            {showLaunchButton ? (
              <button
                type="button"
                onClick={openPreview}
                className={`absolute ${
                  floatingButton ? "bottom-8 right-8" : "left-12 top-8"
                } z-10 rounded-full font-bold text-white shadow-lg transition-transform hover:scale-105 ${buttonPadding}`}
                style={{ backgroundColor: buttonColor }}
              >
                {buttonText || "Open form"}
              </button>
            ) : null}

            {embedType === "standard" ? (
              <div className="h-full w-full overflow-hidden rounded-sm bg-white shadow-sm">
                <iframe
                  key={previewKey}
                  src={publicFormUrl}
                  title="Respondent form embed preview"
                  className="h-full w-full border-0"
                />
              </div>
            ) : null}

            {embedType === "fullscreen" ? (
              <div className="h-full w-full overflow-hidden rounded-sm bg-white shadow-sm">
                <iframe
                  key={previewKey}
                  src={publicFormUrl}
                  title="Respondent form fullscreen preview"
                  className="h-full w-full border-0"
                />
              </div>
            ) : null}

            {activePreview === "popup" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-sm bg-black/65 p-8"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`relative h-[82%] overflow-hidden rounded-sm bg-white shadow-2xl ${popupWidthClass}`}
                >
                  <button
                    type="button"
                    onClick={() => setActivePreview(null)}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55"
                    aria-label="Close popup preview"
                  >
                    <XIcon size={18} />
                  </button>
                  <iframe
                    key={`popup-${previewKey}`}
                    src={publicFormUrl}
                    title="Respondent popup preview"
                    className="h-full w-full border-0"
                  />
                </motion.div>
              </motion.div>
            ) : null}

            {activePreview === "slider" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 rounded-sm bg-black/65"
                onClick={() => setActivePreview(null)}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePreview(null);
                  }}
                  className={`absolute top-1/2 z-30 flex h-12 w-9 -translate-y-1/2 items-center justify-center bg-black/80 text-white transition-colors hover:bg-black ${
                    sliderSide === "right"
                      ? "right-[78%] rounded-l-lg"
                      : "left-[78%] rounded-r-lg"
                  }`}
                  aria-label="Close slider preview"
                >
                  <XIcon size={20} />
                </button>
                <motion.div
                  initial={{
                    x: sliderSide === "right" ? "100%" : "-100%",
                  }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`absolute top-0 h-full w-[78%] overflow-hidden bg-white shadow-2xl ${
                    sliderSide === "right" ? "right-0" : "left-0"
                  }`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <iframe
                    key={`slider-${previewKey}`}
                    src={publicFormUrl}
                    title="Respondent slider preview"
                    className="h-full w-full border-0"
                  />
                </motion.div>
              </motion.div>
            ) : null}
          </div>
        </section>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
