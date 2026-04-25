import { useEffect, useRef, useState, type RefObject } from "react";
import { useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenIcon } from "@phosphor-icons/react";
import {
  RuntimeCoverPagePreview,
  RuntimeEndingPagePreview,
  RuntimeFormPagePreview,
} from "@/components/builder/preview";
import RuntimeProgressBar from "@/components/builder/preview/shared/RuntimeProgressBar";
import SubmissionCelebration from "@/components/builder/preview/shared/SubmissionCelebration";
import { useGetPublicEvent } from "@/hooks/events";
import { useSubmitPublicResponse } from "@/hooks/responses";
import {
  useMutationDeletePublicResponseProgress,
  useMutationSavePublicResponseProgress,
  useMutationTrackPublicAnalyticsEvent,
} from "@/api/responses";
import { useMutationUploadFile } from "@/api/upload";
import type { FormSection, RespondentDeviceType } from "@/types/form";
import { ensureGoogleFontsLoaded } from "@/utils/form/googleFonts";
import {
  getIndexedOptionValues,
  getSelectionCount,
  getSelectionValidationMessage,
} from "@/utils/form/optionSelection";
import {
  getFileUploadCount,
  getFileUploadValidationMessage,
  getFormCalculationsFromSections,
  getRuntimeProgressPercent,
  getRuntimeEndingSection,
  getVisibleFields,
  resolveRuntimeNextTarget,
} from "@/utils/form";
import { resolveTheme, type ThemeConfig } from "@/utils/form/themeConfig";

type PublicFormDraft = {
  answers?: Record<string, string | string[]>;
  otherTexts?: Record<string, string>;
  progressId?: string | null;
  respondentUuid?: string;
  sectionHistory?: number[];
  sessionUuid?: string;
};

function loadDraft(id?: string) {
  if (!id) return null;

  try {
    const raw = localStorage.getItem(`upform-draft-${id}`);
    return raw ? (JSON.parse(raw) as PublicFormDraft) : null;
  } catch (error) {
    console.error("[loadDraft]:", error);
    return null;
  }
}

function hasDraftContent(draft: PublicFormDraft | null) {
  if (!draft) return false;

  return (
    Object.keys(draft.answers ?? {}).length > 0 ||
    Object.keys(draft.otherTexts ?? {}).length > 0 ||
    (draft.sectionHistory?.length ?? 0) > 1
  );
}

function createRuntimeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateRespondentUuid(eventId?: string, fallback?: string) {
  if (!eventId) return fallback ?? createRuntimeId("respondent");
  const key = `upform-respondent-${eventId}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const next = fallback ?? createRuntimeId("respondent");
  localStorage.setItem(key, next);
  return next;
}

function getDeviceType(): RespondentDeviceType {
  const agent = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/.test(agent)) return "mobile";
  return "desktop";
}

function scrollToField(
  fieldRefs: RefObject<Record<string, HTMLDivElement | null>>,
  fieldId: string,
) {
  fieldRefs.current[fieldId]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function PublicFormLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffcf6]">
      <div className="flex w-full max-w-[220px] flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-medium text-[#a89f93]">Powered by</p>
          <p className="text-lg font-bold tracking-tight text-[#312812]">UpForm</p>
        </div>
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-[#e8dfd1] shadow-[0_18px_38px_rgba(103,93,77,0.16)]">
          <motion.div
            className="h-full rounded-full bg-[#312812]"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.15,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function getReadableButtonTextColor(color: string) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return "#ffffff";
  }

  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 148 ? "#111827" : "#ffffff";
}

function ContinueDraftModal({
  onContinue,
  onStartAgain,
  themeConfig,
}: {
  onContinue: () => void;
  onStartAgain: () => void;
  themeConfig: ThemeConfig;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[1px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="w-full max-w-lg rounded-lg border p-6 text-center shadow-2xl"
        style={{
          background: themeConfig.bg,
          borderColor: themeConfig.inputBorder,
          color: themeConfig.textColor,
          fontFamily: themeConfig.fontFamily,
        }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: `${themeConfig.btnBg}1f`,
            color: themeConfig.btnBg,
          }}
        >
          <BookOpenIcon size={22} weight="duotone" />
        </div>

        <h2 className="mx-auto mt-6 max-w-sm text-base font-medium leading-snug">
          You have a submission in progress. Would you like to continue?
        </h2>
        <p className="mt-3 text-sm" style={{ color: themeConfig.inputText }}>
          Starting again will erase all information you have entered.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onStartAgain}
            className="h-10 rounded-sm border px-4 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              borderColor: themeConfig.inputBorder,
              color: themeConfig.textColor,
            }}
          >
            Start again
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="h-10 rounded-sm px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              background: themeConfig.btnBg,
              color: getReadableButtonTextColor(themeConfig.btnBg),
            }}
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PublicFormPage() {
  const { id } = useParams();
  const { data: event, isLoading, isError } = useGetPublicEvent(id ?? "");
  const submitResponse = useSubmitPublicResponse(id ?? "");
  const uploadFile = useMutationUploadFile();
  const draftKey = `upform-draft-${id}`;
  const [initialDraft] = useState(() => loadDraft(id));
  const pendingFilesRef = useRef<Record<string, File[]>>({});
  const progressSaveTimerRef = useRef<number | null>(null);

  const [sectionHistory, setSectionHistory] = useState<number[]>(
    () => initialDraft?.sectionHistory ?? [0],
  );
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    () => initialDraft?.answers ?? {},
  );
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>(
    () => initialDraft?.otherTexts ?? {},
  );
  const [respondentUuid] = useState(() =>
    getOrCreateRespondentUuid(id, initialDraft?.respondentUuid),
  );
  const [sessionUuid, setSessionUuid] = useState(
    () => initialDraft?.sessionUuid ?? createRuntimeId("session"),
  );
  const [progressId, setProgressId] = useState<string | null>(
    () => initialDraft?.progressId ?? null,
  );
  const saveProgress = useMutationSavePublicResponseProgress(id ?? "", {
    onSuccess: (progress) => {
      if (progress.id) setProgressId(progress.id);
    },
  });
  const saveProgressMutateRef = useRef(saveProgress.mutate);
  const deleteProgress = useMutationDeletePublicResponseProgress(id ?? "");
  const trackAnalytics = useMutationTrackPublicAnalyticsEvent(id ?? "");
  const trackAnalyticsMutateRef = useRef(trackAnalytics.mutate);
  const [startedAt] = useState(() => new Date().toISOString());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftPromptOpen, setDraftPromptOpen] = useState(() =>
    hasDraftContent(initialDraft),
  );
  const [submitted, setSubmitted] = useState(false);
  const [submittedEndingSectionId, setSubmittedEndingSectionId] = useState<
    string | null
  >(null);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [shakeIds, setShakeIds] = useState<Set<string>>(new Set());
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const submittingRef = useRef(false);
  const submissionTokenRef = useRef(0);
  const trackedViewRef = useRef(false);
  const trackedStartRef = useRef(false);
  const trackedSectionViewsRef = useRef<Set<string>>(new Set());

  const sections = event?.sections ?? [];
  const calculations = getFormCalculationsFromSections(sections);
  const themeConfig = resolveTheme(event?.theme ?? "light").config;
  const isLightTheme = themeConfig.bg.toLowerCase() === "#ffffff";
  const activeEndingSection = getRuntimeEndingSection(
    sections,
    submittedEndingSectionId ?? undefined,
  );
  const progressPercent = getRuntimeProgressPercent({
    answers,
    calculations,
    sectionHistory,
    sections,
    submittedEndingSectionId: submitted
      ? activeEndingSection?.id ?? submittedEndingSectionId
      : null,
  });
  const currentSectionIndex = sectionHistory[sectionHistory.length - 1] ?? 0;
  const section = sections[currentSectionIndex];

  useEffect(() => {
    ensureGoogleFontsLoaded([
      {
        key: themeConfig.fontKey,
        label: themeConfig.fontKey,
        family: themeConfig.fontFamily,
        category: themeConfig.fontCategory,
      },
    ]);
  }, [
    themeConfig.fontCategory,
    themeConfig.fontFamily,
    themeConfig.fontKey,
  ]);

  useEffect(() => {
    if (event) document.title = `${event.name || "Untitled Form"} - UpForm`;
    return () => {
      document.title = "UpForm";
    };
  }, [event]);

  useEffect(() => {
    saveProgressMutateRef.current = saveProgress.mutate;
  }, [saveProgress.mutate]);

  useEffect(() => {
    trackAnalyticsMutateRef.current = trackAnalytics.mutate;
  }, [trackAnalytics.mutate]);

  useEffect(() => {
    if (!id || !event || trackedViewRef.current) return;
    trackedViewRef.current = true;
    trackAnalyticsMutateRef.current({
      deviceType: getDeviceType(),
      respondentUuid,
      sessionUuid,
      type: "view",
      userAgent: navigator.userAgent,
    });
  }, [event, id, respondentUuid, sessionUuid]);

  useEffect(() => {
    if (!id || !event || !section || submitted) return;

    const sectionViewKey = `${currentSectionIndex}:${section.id}`;
    if (!trackedSectionViewsRef.current.has(sectionViewKey)) {
      trackedSectionViewsRef.current.add(sectionViewKey);
      trackAnalyticsMutateRef.current({
        currentSectionId: section.id,
        currentSectionIndex,
        deviceType: getDeviceType(),
        progressPercent,
        respondentUuid,
        sectionHistory,
        sessionUuid,
        type: "section_view",
        userAgent: navigator.userAgent,
      });
    }

    if (
      !trackedStartRef.current &&
      (section.pageType ?? "page") !== "cover"
    ) {
      trackedStartRef.current = true;
      trackAnalyticsMutateRef.current({
        currentSectionId: section.id,
        currentSectionIndex,
        deviceType: getDeviceType(),
        progressPercent,
        respondentUuid,
        sectionHistory,
        sessionUuid,
        type: "start",
        userAgent: navigator.userAgent,
      });
    }
  }, [
    currentSectionIndex,
    event,
    id,
    progressPercent,
    respondentUuid,
    section,
    sectionHistory,
    sessionUuid,
    submitted,
  ]);

  useEffect(() => {
    return () => {
      if (progressSaveTimerRef.current) {
        window.clearTimeout(progressSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!id || submitted) return;

    const hasData =
      Object.keys(answers).length > 0 ||
      Object.keys(otherTexts).length > 0 ||
      sectionHistory.length > 1;

    if (hasData) {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers,
          otherTexts,
          progressId,
          respondentUuid,
          sectionHistory,
          sessionUuid,
        }),
      );

      if (progressSaveTimerRef.current) {
        window.clearTimeout(progressSaveTimerRef.current);
      }
      progressSaveTimerRef.current = window.setTimeout(() => {
        saveProgressMutateRef.current({
          answers,
          currentSectionId: section?.id ?? null,
          currentSectionIndex,
          deviceType: getDeviceType(),
          otherTexts,
          progressId,
          progressPercent,
          respondentUuid,
          sectionHistory,
          startedAt,
          userAgent: navigator.userAgent,
        });
      }, 650);
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [
    answers,
    currentSectionIndex,
    draftKey,
    id,
    otherTexts,
    progressId,
    progressPercent,
    respondentUuid,
    section?.id,
    sectionHistory,
    sessionUuid,
    startedAt,
    submitted,
  ]);

  useEffect(() => {
    if (Object.keys(answers).length === 0 || submitted) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [answers, submitted]);

  const visibleSectionFields = getVisibleFields(section?.fields ?? [], {
    answers,
    calculations,
  });
  const nextTarget = section
    ? resolveRuntimeNextTarget(
        sections,
        section.id,
        visibleSectionFields,
        answers,
      )
    : { kind: "complete" as const };

  const setAnswer = (fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setShakeIds((prev) => {
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
  };

  const validate = (sec: FormSection | undefined) => {
    const errs: Record<string, string> = {};
    if (!sec || sec.pageType !== "page") return errs;

    const visibleFields = getVisibleFields(sec.fields, { answers, calculations });

    visibleFields.forEach((field) => {
      if (field.type === "next_button") return;

      const value =
        answers[field.id] ??
        (field.type === "multiselect"
          ? (() => {
              const defaults = getIndexedOptionValues(field.options, field.defaultValue);
              return defaults.length > 0 ? defaults : undefined;
            })()
          : undefined);
      const isSelectionField =
        field.type === "multiple_choice" ||
        field.type === "checkbox" ||
        field.type === "multiselect";
      const isDisplayOnly =
        field.type === "title_block" ||
        field.type === "image_block" ||
        field.type === "banner_block" ||
        field.type === "divider" ||
        field.type === "thank_you_block";

      if (isDisplayOnly) return;

      if (isSelectionField) {
        const selectionError = getSelectionValidationMessage(
          field,
          getSelectionCount(value),
        );
        if (selectionError) {
          errs[field.id] = selectionError;
          return;
        }
      } else if (field.type === "file_upload") {
        const fileUploadError = getFileUploadValidationMessage(
          field,
          getFileUploadCount(value),
        );
        if (fileUploadError) {
          errs[field.id] = fileUploadError;
          return;
        }
      } else if (
        field.required &&
        (!value || (Array.isArray(value) && value.length === 0) || value === "")
      ) {
        errs[field.id] = field.validationMessage || "This question is required.";
      }

      if (
        field.type === "email" &&
        value &&
        typeof value === "string" &&
        value.length > 0 &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        errs[field.id] = "Format email tidak valid.";
      }
    });

    return errs;
  };

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    setShakeIds(new Set(Object.keys(errs)));

    const firstFieldId = Object.keys(errs)[0];
    if (firstFieldId) {
      scrollToField(fieldRefs, firstFieldId);
    }
  };

  const submitForm = async (
    endingSectionId?: string,
    skipValidation = false,
  ) => {
    if (!section || submittingRef.current) return;

    if (!skipValidation) {
      const errs = validate(section);
      if (Object.keys(errs).length > 0) {
        showErrors(errs);
        return;
      }
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors({});

    try {
      const finalAnswers = { ...answers };

      sections.forEach((entry) => {
        entry.fields.forEach((field) => {
          if (field.type !== "multiselect" || finalAnswers[field.id] !== undefined) {
            return;
          }

          const defaults = getIndexedOptionValues(field.options, field.defaultValue);
          if (defaults.length > 0) {
            finalAnswers[field.id] = defaults;
          }
        });
      });

      for (const [fieldId, files] of Object.entries(pendingFilesRef.current)) {
        if (files.length === 0) continue;

        const uploaded: string[] = [];
        for (const file of files) {
          const result = await uploadFile.mutateAsync(file);
          uploaded.push(`${result.filename}::${result.url}`);
        }

        finalAnswers[fieldId] = uploaded.length === 1 ? uploaded[0] : uploaded;
      }

      if (progressSaveTimerRef.current) {
        window.clearTimeout(progressSaveTimerRef.current);
        progressSaveTimerRef.current = null;
      }

      const endingSectionIndex = endingSectionId
        ? sections.findIndex((item) => item.id === endingSectionId)
        : -1;
      const finalSectionHistory =
        endingSectionIndex >= 0 && !sectionHistory.includes(endingSectionIndex)
          ? [...sectionHistory, endingSectionIndex]
          : sectionHistory;

      const submitPayload = {
        answers: finalAnswers,
        deviceType: getDeviceType(),
        progressId,
        respondentUuid,
        sectionHistory: finalSectionHistory,
        startedAt,
        userAgent: navigator.userAgent,
      };

      pendingFilesRef.current = {};
      setAnswers(finalAnswers);
      setCelebrationKey((prev) => prev + 1);
      setSubmittedEndingSectionId(endingSectionId ?? null);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      trackAnalyticsMutateRef.current({
        answers: finalAnswers,
        currentSectionId: endingSectionId ?? section.id,
        currentSectionIndex:
          endingSectionIndex >= 0 ? endingSectionIndex : currentSectionIndex,
        deviceType: getDeviceType(),
        progressPercent: 100,
        respondentUuid,
        sectionHistory: finalSectionHistory,
        sessionUuid,
        type: "finish",
        userAgent: navigator.userAgent,
      });
      const submissionToken = submissionTokenRef.current + 1;
      submissionTokenRef.current = submissionToken;

      submitResponse.mutate(submitPayload, {
        onError: (error) => {
          if (submissionTokenRef.current !== submissionToken) return;
          console.error("Error (submitForm):", error);
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              answers: finalAnswers,
              otherTexts,
              progressId,
              respondentUuid,
              sectionHistory,
              sessionUuid,
            }),
          );
        },
        onSuccess: () => {
          if (submissionTokenRef.current !== submissionToken) return;
          localStorage.removeItem(draftKey);
          setProgressId(null);
        },
      });
    } catch (error) {
      console.error("Error (submitForm):", error);
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const moveToNext = (skipValidation = false) => {
    if (!section || isSubmitting) return;

    if (!skipValidation) {
      const errs = validate(section);
      if (Object.keys(errs).length > 0) {
        showErrors(errs);
        return;
      }
    }

    setErrors({});
    setDirection(1);

    if (nextTarget.kind === "section") {
      setSectionHistory((prev) => [...prev, nextTarget.index]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    void submitForm(
      nextTarget.kind === "ending" ? nextTarget.sectionId : undefined,
      true,
    );
  };

  const handleBack = () => {
    setErrors({});
    setDirection(-1);
    setSectionHistory((prev) => prev.slice(0, -1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitAnother = () => {
    submissionTokenRef.current += 1;
    localStorage.removeItem(draftKey);
    if (progressSaveTimerRef.current) {
      window.clearTimeout(progressSaveTimerRef.current);
      progressSaveTimerRef.current = null;
    }
    if (progressId) deleteProgress.mutate(progressId);
    pendingFilesRef.current = {};
    setAnswers({});
    setOtherTexts({});
    setErrors({});
    setSectionHistory([0]);
    setSubmitted(false);
    setSubmittedEndingSectionId(null);
    setProgressId(null);
    setSessionUuid(createRuntimeId("session"));
    setCelebrationKey(0);
    trackedStartRef.current = false;
    trackedSectionViewsRef.current = new Set();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartAgainFromDraft = () => {
    localStorage.removeItem(draftKey);
    if (progressSaveTimerRef.current) {
      window.clearTimeout(progressSaveTimerRef.current);
      progressSaveTimerRef.current = null;
    }
    if (progressId) deleteProgress.mutate(progressId);
    pendingFilesRef.current = {};
    setAnswers({});
    setOtherTexts({});
    setErrors({});
    setSectionHistory([0]);
    setSubmitted(false);
    setSubmittedEndingSectionId(null);
    setProgressId(null);
    setSessionUuid(createRuntimeId("session"));
    setCelebrationKey(0);
    trackedStartRef.current = false;
    trackedSectionViewsRef.current = new Set();
    setDraftPromptOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return <PublicFormLoadingScreen />;
  }

  if (isError || (!isLoading && !event)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <p className="mb-4 text-lg font-black text-primary-500">404</p>
          <p className="text-2xl font-extrabold text-black">
            Oops! This form does not exist :(
          </p>
          <p className="mb-16 text-lg font-semibold text-gray-400">
            This form may have been closed or deleted by the owner
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen"
        style={{ background: themeConfig.canvasBg }}
      >
        <RuntimeProgressBar value={progressPercent} themeConfig={themeConfig} />
        <SubmissionCelebration
          celebrationKey={celebrationKey}
          className="min-h-screen"
        >
          {activeEndingSection ? (
            <RuntimeEndingPagePreview
              answers={answers}
              calculations={calculations}
              emptyMessage="No content in this section yet."
              errors={{}}
              fieldsRef={fieldRefs}
              isSubmittedView
              isLightTheme={isLightTheme}
              onAnimationComplete={() => {}}
              onAnswer={setAnswer}
              onFillAgain={handleSubmitAnother}
              onOtherTextChange={(fieldId, text) =>
                setOtherTexts((prev) => ({ ...prev, [fieldId]: text }))
              }
              otherTexts={otherTexts}
              section={activeEndingSection}
              shakeIds={new Set()}
              themeConfig={themeConfig}
            />
          ) : null}
        </SubmissionCelebration>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: themeConfig.canvasBg }}
    >
      <RuntimeProgressBar value={progressPercent} themeConfig={themeConfig} />
      <AnimatePresence mode="wait">
        <motion.div
          key={section?.id ?? "empty"}
          className="w-full"
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {section?.pageType === "cover" ? (
            <RuntimeCoverPagePreview
              containerClassName="min-h-screen"
              section={section}
              themeConfig={themeConfig}
              onStart={() => moveToNext(true)}
            />
          ) : section ? (
            <RuntimeFormPagePreview
              answers={answers}
              backButtonClassName="left-3 top-3 sm:left-4 sm:top-4"
              calculations={calculations}
              emptyMessage="No questions in this section yet."
              errors={errors}
              fieldsRef={fieldRefs}
              isLightTheme={isLightTheme}
              onAnimationComplete={(fieldId) =>
                setShakeIds((prev) => {
                  const next = new Set(prev);
                  next.delete(fieldId);
                  return next;
                })
              }
              onAnswer={setAnswer}
              onBack={handleBack}
              onNext={() => moveToNext(false)}
              onOtherTextChange={(fieldId, text) =>
                setOtherTexts((prev) => ({ ...prev, [fieldId]: text }))
              }
              onSkip={() => moveToNext(true)}
              nextButtonLabel={nextTarget.kind === "section" ? "Next" : "Submit"}
              otherTexts={otherTexts}
              pendingFilesRef={pendingFilesRef}
              section={section}
              showBack={sectionHistory.length > 1}
              shakeIds={shakeIds}
              themeConfig={themeConfig}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {draftPromptOpen ? (
          <ContinueDraftModal
            themeConfig={themeConfig}
            onContinue={() => setDraftPromptOpen(false)}
            onStartAgain={handleStartAgainFromDraft}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
