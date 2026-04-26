import { type RefObject } from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import AddressField from "@/components/builder/section/AddressField";
import { BuilderMultiselectField } from "@/components/builder/section/BuilderMultiselectField";
import CheckboxField from "@/components/builder/section/CheckboxField";
import CurrencyField from "@/components/builder/section/CurrencyField";
import DatePickerField from "@/components/builder/section/DatePickerField";
import DropdownField from "@/components/builder/section/DropdownField";
import EmailField from "@/components/builder/section/EmailField";
import { LinearScaleField } from "@/components/builder/section/LinearScaleField";
import MultipleChoiceField from "@/components/builder/section/MultipleChoiceField";
import NumberField from "@/components/builder/section/NumberField";
import OpinionScaleField from "@/components/builder/section/OpinionScaleField";
import ParagraphField from "@/components/builder/section/ParagraphField";
import PhoneField from "@/components/builder/section/PhoneField";
import RankingField from "@/components/builder/section/RankingField";
import RatingField from "@/components/builder/section/RatingField";
import RichTextField from "@/components/builder/section/RichTextField";
import ShortTextField from "@/components/builder/section/ShortTextField";
import TimeField from "@/components/builder/section/TimeField";
import { SelectionCheckIcon } from "@/components/icons";
import type { FormCalculation, FormField } from "@/types/form";
import {
  resolveReferenceHtml,
  resolveReferenceText,
  stripHtmlToText,
} from "@/utils/form/referenceTokens";
import RuntimeFileUploadField from "./RuntimeFileUploadField";

const shakeVariants = {
  shake: {
    opacity: 1,
    y: 0,
    x: [0, -6, 6, -6, 6, -3, 3, 0],
    transition: { duration: 0.4 },
  },
  idle: { opacity: 1, y: 0, x: 0 },
};

const BANNER_STYLES = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    text: "text-blue-900",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
    text: "text-amber-900",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
    text: "text-red-900",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-500",
    text: "text-green-900",
  },
} as const;

function BannerIcon({ type }: { type: FormField["bannerType"] }) {
  const iconType = type ?? "info";

  if (iconType === "warning") {
    return <WarningIcon size={16} weight="fill" />;
  }

  if (iconType === "error") {
    return <WarningCircleIcon size={16} weight="fill" />;
  }

  if (iconType === "success") {
    return <CheckCircleIcon size={16} weight="fill" />;
  }

  return <InfoIcon size={16} weight="fill" />;
}

function getRankingOptions(value: string | string[] | undefined, field: FormField) {
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((entry) => typeof entry === "string")
      ) {
        return parsed;
      }
    } catch {
      // Ignore malformed runtime values and fall back to field options.
    }
  }

  return field.options ?? [];
}

function parseAddressValue(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as {
        city?: string;
        state?: string;
        street?: string;
        zip?: string;
      };
    }
  } catch {
    // Ignore malformed runtime values and fall back to an empty object.
  }

  return {};
}

type Props = {
  answers?: Record<string, string | string[]>;
  calculations?: FormCalculation[];
  field: FormField;
  value?: string | string[];
  otherText?: string;
  hasError: boolean;
  errorMessage?: string;
  isShaking: boolean;
  onAnswer: (value: string | string[]) => void;
  onOtherTextChange: (text: string) => void;
  onAnimationComplete: () => void;
  setRef: (el: HTMLDivElement | null) => void;
  pendingFilesRef?: RefObject<Record<string, File[]>>;
};

export default function PreviewField({
  answers,
  calculations,
  field,
  value,
  otherText = "",
  hasError,
  errorMessage,
  isShaking,
  onAnswer,
  onOtherTextChange,
  onAnimationComplete,
  setRef,
  pendingFilesRef,
}: Props) {
  const referenceContext = { answers, calculations };
  const resolvedLabelHtml = resolveReferenceHtml(field.label, referenceContext);
  const resolvedPlainLabel = resolveReferenceText(field.label, referenceContext);
  const resolvedDescriptionHtml = resolveReferenceHtml(
    field.description,
    referenceContext,
  );
  const resolvedPlaceholder = resolveReferenceText(
    field.placeholder,
    referenceContext,
  );
  const resolvedDefaultHtml = resolveReferenceHtml(field.defaultValue, {
    ...referenceContext,
  });
  const hasConfiguredPlaceholder = Boolean(stripHtmlToText(field.placeholder));
  const getResolvedPlaceholder = (fallback: string) =>
    hasConfiguredPlaceholder ? resolvedPlaceholder : fallback;
  const cardSurfaceClass = "theme-question-card rounded-xl bg-white";
  const displaySurfaceClass = "rounded-xl bg-transparent";
  const responseCardClass = `${cardSurfaceClass} p-5 sm:p-6 ${
    hasError ? "ring-1 ring-red-300" : ""
  }`;
  const val = value;

  if (field.type === "divider") {
    return <hr className="my-1 border-gray-200" />;
  }

  if (field.type === "next_button") {
    const isFull = field.buttonAlign === "full";
    const buttonAlignClass =
      field.buttonAlign === "center"
        ? "justify-center"
        : field.buttonAlign === "right"
          ? "justify-end"
          : "justify-start";

    return (
      <div className={`flex items-center gap-3 ${isFull ? "" : buttonAlignClass}`}>
        <button
          onClick={() => onAnswer("__next__")}
          className={`theme-primary-button rounded-lg py-2.5 text-sm font-semibold transition-colors ${isFull ? "w-full" : "px-6"}`}
          style={{
            background: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
            color:
              field.textColor || "var(--upform-theme-button-text, #ffffff)",
          }}
        >
          {resolvedPlainLabel || "Next"}
        </button>
        {field.showSkip ? (
          <button
            onClick={() => onAnswer("__skip__")}
            className="theme-primary-text text-sm"
            style={{
              color: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
            }}
          >
            Skip
          </button>
        ) : null}
      </div>
    );
  }

  if (field.type === "fill_again_button") {
    const isFull = field.buttonAlign === "full";
    const buttonAlignClass =
      field.buttonAlign === "center"
        ? "justify-center"
        : field.buttonAlign === "right"
          ? "justify-end"
          : "justify-start";

    return (
      <div className={isFull ? "" : `flex ${buttonAlignClass}`}>
        <button
          onClick={() => onAnswer("fill_again")}
          className={`theme-primary-button rounded-lg py-2 text-sm font-semibold transition-colors ${isFull ? "w-full" : "px-5"}`}
          style={{
            background: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
            color:
              field.textColor || "var(--upform-theme-button-text, #ffffff)",
          }}
        >
          {resolvedPlainLabel || "Fill out again"}
        </button>
      </div>
    );
  }

  if (field.type === "url_button") {
    const isFull = field.buttonAlign === "full";
    const buttonAlignClass =
      field.buttonAlign === "center"
        ? "justify-center"
        : field.buttonAlign === "right"
          ? "justify-end"
          : "justify-start";

    return (
      <div className={isFull ? "" : `flex ${buttonAlignClass}`}>
        <a
          href={field.buttonUrl || "#"}
          target={field.openInNewTab ? "_blank" : undefined}
          rel={field.openInNewTab ? "noopener noreferrer" : undefined}
          className={`theme-primary-button inline-block rounded-lg py-2 text-center text-sm font-semibold transition-colors ${isFull ? "w-full" : "px-6"}`}
          style={{
            background: field.buttonColor || "var(--upform-theme-primary, #0054a5)",
            color:
              field.textColor || "var(--upform-theme-button-text, #ffffff)",
          }}
        >
          {resolvedPlainLabel || "Visit link"}
        </a>
      </div>
    );
  }

  if (field.type === "thank_you_block") {
    return (
      <div className={`${displaySurfaceClass} flex flex-col items-center gap-2 px-5 py-6 text-center`}>
        <CheckCircleIcon size={40} weight="fill" className="text-emerald-500" />
        <h3
          className="theme-question-title text-lg font-bold text-gray-900 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: resolvedLabelHtml || "Thank You!" }}
        />
        {field.subtitle ? (
          <p className="theme-question-caption text-sm text-gray-500">
            {field.subtitle}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "banner_block") {
    const bannerStyle = BANNER_STYLES[field.bannerType ?? "info"];

    return (
      <div className="px-5 sm:px-6">
        <div
          className={`${bannerStyle.bg} ${bannerStyle.border} flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5`}
        >
          <span className={`${bannerStyle.icon} shrink-0`}>
            <BannerIcon type={field.bannerType} />
          </span>
          <div
            className={`${bannerStyle.text} min-w-0 flex-1 text-sm leading-normal [&_li]:leading-normal [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5`}
            dangerouslySetInnerHTML={{ __html: resolvedLabelHtml || "" }}
          />
        </div>
      </div>
    );
  }

  if (field.type === "paragraph") {
    return (
      <div className={`${displaySurfaceClass} px-5 pb-4 pt-5`}>
        {resolvedLabelHtml ? (
          <p
            className="theme-question-title mb-1 text-base leading-snug text-gray-900"
            dangerouslySetInnerHTML={{ __html: resolvedLabelHtml }}
          />
        ) : null}
        {resolvedDefaultHtml ? (
          <div
            className="theme-question-caption text-sm leading-relaxed text-gray-700 [&_li]:leading-normal [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: resolvedDefaultHtml }}
          />
        ) : null}
      </div>
    );
  }

  if (field.type === "rich_text") {
    return (
      <div className={`${cardSurfaceClass} relative`}>
        <div className="flex">
          <div className="w-6 shrink-0" />
          <div className="min-w-0 flex-1 py-4 pr-5">
            {resolvedLabelHtml || resolvedDescriptionHtml ? (
              <div className="mb-2">
                {resolvedLabelHtml ? (
                  <div
                    className="theme-question-title border-b-2 border-transparent pb-1 text-sm font-medium text-gray-900"
                    dangerouslySetInnerHTML={{ __html: resolvedLabelHtml }}
                  />
                ) : null}
                {resolvedDescriptionHtml ? (
                  <div
                    className="theme-question-caption whitespace-pre-wrap text-xs leading-snug text-gray-500"
                    dangerouslySetInnerHTML={{ __html: resolvedDescriptionHtml }}
                  />
                ) : null}
              </div>
            ) : null}

            <RichTextField
              defaultValue={typeof val === "string" ? val : resolvedDefaultHtml}
              onChange={(nextValue) => onAnswer(nextValue)}
              placeholder={
                hasConfiguredPlaceholder ? resolvedPlaceholder : "Write something here..."
              }
              showToolbar
            />
          </div>
        </div>
      </div>
    );
  }

  if (field.type === "title_block") {
    return (
      <div className={`${displaySurfaceClass} px-5 pb-4 pt-5`}>
        {field.headerImage ? (
          <img
            src={field.headerImage}
            className="mb-4 max-h-40 w-full rounded-lg object-cover"
            alt=""
          />
        ) : null}
        {resolvedLabelHtml ? (
          <h3
            className="theme-question-title text-lg font-semibold leading-snug text-gray-900 [&_li]:leading-normal [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: resolvedLabelHtml }}
          />
        ) : null}
        {resolvedDescriptionHtml ? (
          <div
            className="theme-question-caption mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-900"
            dangerouslySetInnerHTML={{ __html: resolvedDescriptionHtml }}
          />
        ) : null}
      </div>
    );
  }

  if (field.type === "image_block") {
    if (!field.headerImage) return null;

    return (
      <div
        className={
          field.imageAlign === "center"
            ? "flex justify-center"
            : field.imageAlign === "right"
              ? "flex justify-end"
              : ""
        }
      >
        <div style={{ width: `${field.imageWidth ?? 100}%` }}>
          <img
            src={field.headerImage}
            className="w-full rounded-lg object-cover"
            alt=""
          />
          {field.imageCaption ? (
            <p className="mt-1 text-center text-xs text-gray-500">
              {field.imageCaption}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={setRef}
      variants={shakeVariants}
      animate={isShaking ? "shake" : "idle"}
      onAnimationComplete={onAnimationComplete}
      initial={{ opacity: 0, y: 8 }}
      className={responseCardClass}
    >
      {field.type !== "single_checkbox" ? (
        <p className="theme-question-title mb-1 text-[15px] font-medium leading-snug text-gray-900">
          <span
            dangerouslySetInnerHTML={{
              __html: resolvedLabelHtml || "Untitled Question",
            }}
          />
          {field.required ? <span className="ml-1 text-red-500">*</span> : null}
        </p>
      ) : null}

      {resolvedDescriptionHtml ? (
        <div
          className="theme-question-caption mb-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-500"
          dangerouslySetInnerHTML={{ __html: resolvedDescriptionHtml }}
        />
      ) : null}

      {field.headerImage ? (
        <div
          className={`mb-3 mt-2 ${
            field.imageAlign === "center"
              ? "flex justify-center"
              : field.imageAlign === "right"
                ? "flex justify-end"
                : ""
          }`}
        >
          <div style={{ width: `${field.imageWidth ?? 100}%` }}>
            <img
              src={field.headerImage}
              className="w-full rounded-lg object-cover"
              alt=""
            />
            {field.imageCaption ? (
              <p className="theme-question-caption mt-1 text-center text-xs text-gray-500">
                {field.imageCaption}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {field.type === "short_text" ? (
        <ShortTextField
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          placeholder={getResolvedPlaceholder("Your answer")}
          onChange={(nextValue) => onAnswer(nextValue)}
        />
      ) : null}

      {field.type === "long_text" ? (
        <ParagraphField
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          placeholder={getResolvedPlaceholder("Long answer...")}
          onChange={(nextValue) => onAnswer(nextValue)}
        />
      ) : null}

      {field.type === "date" ? (
        <DatePickerField
          hasError={hasError}
          value={(val as string) ?? ""}
          onChange={(nextValue) => onAnswer(nextValue)}
          placeholder={hasConfiguredPlaceholder ? resolvedPlaceholder : undefined}
        />
      ) : null}

      {field.type === "time" ? (
        <TimeField
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          onChange={(nextValue) => onAnswer(nextValue)}
        />
      ) : null}

      {field.type === "rating" &&
        <RatingField
          allowHalfStar={field.allowHalfStar}
          defaultValue={(val as string) ?? ""}
          maxLabel={field.maxLabel}
          minLabel={field.minLabel}
          onChange={(nextValue) => onAnswer(nextValue)}
          ratingIcon={field.ratingIcon}
          scaleMax={field.scaleMax}
        />}

      {field.type === "linear_scale" &&
        <LinearScaleField
          defaultValue={(val as string) ?? ""}
          displayCurrentValue={field.displayCurrentValue}
          maxLabel={field.maxLabel}
          minLabel={field.minLabel}
          onChange={(nextValue) => onAnswer(nextValue)}
          scaleMax={field.scaleMax}
          showValueAsPercentage={field.showValueAsPercentage}
        />}

      {field.type === "opinion_scale" ? (
        <OpinionScaleField
          defaultValue={(val as string) ?? ""}
          max={field.scaleMax}
          maxLabel={field.maxLabel}
          min={field.scaleMin}
          minLabel={field.minLabel}
          onChange={(nextValue) => onAnswer(nextValue ?? "")}
        />
      ) : null}

      {field.type === "multiple_choice" ? (
        <MultipleChoiceField
          defaultValue={typeof val === "string" ? val : undefined}
          maxVisibleOptions={field.options?.length || 2}
          onChange={(nextValue) => onAnswer(nextValue ?? "")}
          onOtherTextChange={onOtherTextChange}
          optionImages={field.optionImages}
          optionImageWidths={field.optionImageWidths}
          options={field.options ?? []}
          otherText={otherText}
          selectionMode="label"
          showOtherOption={field.hasOtherOption}
        />
      ) : null}

      {field.type === "checkbox" ? (
        <CheckboxField
          defaultValue={field.defaultValue}
          maxVisibleOptions={field.options?.length || 2}
          onChange={() => undefined}
          onOtherTextChange={onOtherTextChange}
          onRuntimeChange={(nextValues) => onAnswer(nextValues)}
          optionImages={field.optionImages}
          optionImageWidths={field.optionImageWidths}
          options={field.options ?? []}
          otherText={otherText}
          selectedValues={
            Array.isArray(val)
              ? val
              : typeof val === "string" && val
                ? [val]
                : []
          }
          showOtherOption={field.hasOtherOption}
        />
      ) : null}

      {field.type === "multiselect" ? (
        <BuilderMultiselectField
          defaultValue={field.defaultValue}
          hasError={hasError}
          onChange={() => undefined}
          onRuntimeChange={(nextValues) => onAnswer(nextValues)}
          options={field.options ?? []}
          placeholder={hasConfiguredPlaceholder ? resolvedPlaceholder : undefined}
          selectedValues={
            Array.isArray(val)
              ? val
              : typeof val === "string" && val
                ? [val]
                : undefined
          }
        />
      ) : null}

      {field.type === "dropdown" ? (
        <DropdownField
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          onChange={(nextValue) => onAnswer(nextValue ?? "")}
          options={field.options ?? []}
          placeholder={getResolvedPlaceholder("Choose an option")}
          showClearButton
        />
      ) : null}

      {field.type === "email" ? (
        <EmailField
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          placeholder={getResolvedPlaceholder("email@example.com")}
          onChange={(nextValue) => onAnswer(nextValue)}
        />
      ) : null}

      {field.type === "number" ? (
        <NumberField
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          onChange={(nextValue) => onAnswer(nextValue)}
          placeholder={getResolvedPlaceholder("0")}
        />
      ) : null}

      {field.type === "phone" ? (
        <PhoneField
          countryCode={field.countryCode ?? "US"}
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          onChange={(nextValue) => onAnswer(nextValue)}
          placeholder={hasConfiguredPlaceholder ? resolvedPlaceholder : undefined}
        />
      ) : null}

      {field.type === "currency" ? (
        <CurrencyField
          currencyCode={field.currencyCode}
          defaultValue={(val as string) ?? ""}
          hasError={hasError}
          onChange={(nextValue) => onAnswer(nextValue)}
          placeholder={getResolvedPlaceholder("0.00")}
        />
      ) : null}

      {field.type === "address" &&
        (() => {
          const addressValue = parseAddressValue(val);

          return (
            <AddressField
              cityPlaceholder={field.addressSubPlaceholders?.city}
              cityValue={addressValue.city}
              hasError={hasError}
              onChange={(nextValue) => onAnswer(JSON.stringify(nextValue))}
              statePlaceholder={field.addressSubPlaceholders?.state}
              stateValue={addressValue.state}
              streetPlaceholder={field.addressSubPlaceholders?.street}
              streetValue={addressValue.street}
              zipPlaceholder={field.addressSubPlaceholders?.zip}
              zipValue={addressValue.zip}
            />
          );
        })()}

      {field.type === "ranking" ? (
        <RankingField
          options={getRankingOptions(val, field)}
          onChange={(nextItems) => onAnswer(JSON.stringify(nextItems))}
        />
      ) : null}

      {field.type === "file_upload" ? (
        <RuntimeFileUploadField
          field={field}
          hasError={hasError}
          onAnswer={onAnswer}
          pendingFilesRef={pendingFilesRef}
          value={val}
        />
      ) : null}

      {field.type === "single_checkbox" ? (
        <label className="flex cursor-pointer select-none items-start gap-3">
          <div
            onClick={() => onAnswer(val === "true" ? "" : "true")}
            className={`theme-primary-border mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              val === "true"
                ? "bg-primary-500"
                : hasError
                  ? "border-red-400"
                  : "border-gray-300 hover:border-gray-400"
            }`}
            style={
              val === "true"
                ? {
                    background:
                      "var(--upform-theme-primary, #0054a5)",
                    borderColor: "var(--upform-theme-primary, #0054a5)",
                  }
                : undefined
            }
          >
            {val === "true" ? <SelectionCheckIcon className="text-white" /> : null}
          </div>
          <span
            className="theme-question-title text-sm leading-snug text-gray-700"
            dangerouslySetInnerHTML={{ __html: resolvedLabelHtml || "I agree" }}
          />
        </label>
      ) : null}

      {field.type === "single_checkbox" && resolvedDescriptionHtml ? (
        <div
          className="theme-question-caption mt-2 whitespace-pre-wrap pl-7 text-sm leading-relaxed text-gray-500"
          dangerouslySetInnerHTML={{ __html: resolvedDescriptionHtml }}
        />
      ) : null}

      {hasError ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-2 text-xs font-medium text-red-500"
        >
          {errorMessage}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
