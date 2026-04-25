import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CaretDownIcon,
  HouseIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  RuntimeCoverPagePreview,
  RuntimeEndingPagePreview,
  RuntimeFormPagePreview,
} from "@/components/builder/preview";
import RuntimeProgressBar from "@/components/builder/preview/shared/RuntimeProgressBar";
import PageMenuDropdown, {
  type PageMenuDropdownOption,
} from "@/components/builder/layout/form/PageMenuDropdown";
import SubmissionCelebration from "@/components/builder/preview/shared/SubmissionCelebration";
import { PAGE_TYPE_BADGE_CLASS, PAGE_TYPE_ICONS } from "@/constants";
import type { FormSection } from "@/types/form";
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
  getRuntimeEndingSection,
  getRuntimeProgressPercent,
  getVisibleFields,
  resolveRuntimeNextTarget,
} from "@/utils/form";
import { resolveTheme } from "@/utils/form/themeConfig";

type FormState = {
  sections: FormSection[];
  formTitle: string;
  formDescription: string;
  bannerColor?: string;
  bannerImage?: string | null;
  theme?: string;
};

type PreviewSectionOption = {
  index: number;
  label: string;
  pageType: "cover" | "page" | "ending";
  sectionId: string;
};

function scrollToField(
  fieldRefs: RefObject<Record<string, HTMLDivElement | null>>,
  fieldId: string,
) {
  fieldRefs.current[fieldId]?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function getPreviewSectionLabel(sections: FormSection[], index: number) {
  const section = sections[index];
  if (!section) return `Page ${index + 1}`;

  const title = section.title?.trim();
  if (title) return title;

  const pageType = section.pageType ?? "page";
  if (pageType === "cover") return "Cover";
  if (pageType === "ending") return "Ending";

  const pageNumber = sections
    .slice(0, index + 1)
    .filter((candidate) => (candidate.pageType ?? "page") === "page").length;

  return `Page ${pageNumber}`;
}

function buildPreviewSectionOptions(
  sections: FormSection[],
): PreviewSectionOption[] {
  return sections.map((section, index) => ({
    index,
    label: getPreviewSectionLabel(sections, index),
    pageType: section.pageType ?? "page",
    sectionId: section.id,
  }));
}

export default function EventPreviewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as FormState | null;

  const sections = state?.sections ?? [];
  const calculations = getFormCalculationsFromSections(sections);
  const formTitle = state?.formTitle ?? "Untitled Form";
  const formDescription = state?.formDescription ?? "";
  const bannerColor = state?.bannerColor ?? "#0054a5";
  const bannerImage = state?.bannerImage ?? null;
  const themeValue = state?.theme ?? "light";
  const themeConfig = resolveTheme(themeValue).config;
  const isLightTheme = themeConfig.bg.toLowerCase() === "#ffffff";

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

  const [sectionHistory, setSectionHistory] = useState<number[]>([0]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedEndingSectionId, setSubmittedEndingSectionId] = useState<
    string | null
  >(null);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [shakeIds, setShakeIds] = useState<Set<string>>(new Set());
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingFilesRef = useRef<Record<string, File[]>>({});
  const pageMenuRef = useRef<HTMLDivElement | null>(null);

  const currentSectionIndex = sectionHistory[sectionHistory.length - 1] ?? 0;
  const section = sections[currentSectionIndex];
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
  const previewSectionOptions = useMemo(
    () => buildPreviewSectionOptions(sections),
    [sections],
  );
  const endingSectionIndex = activeEndingSection
    ? sections.findIndex((candidate) => candidate.id === activeEndingSection.id)
    : -1;
  const displayedSectionIndex =
    submitted && endingSectionIndex >= 0 ? endingSectionIndex : currentSectionIndex;
  const activeSectionOption =
    previewSectionOptions.find((option) => option.index === displayedSectionIndex) ??
    previewSectionOptions[0] ??
    null;
  const previewSectionMenuOptions = useMemo(
    () =>
      previewSectionOptions.map(
        (option): PageMenuDropdownOption => ({
          id: option.sectionId,
          label: option.label,
          pageType: option.pageType,
        }),
      ),
    [previewSectionOptions],
  );
  const previewBackButtonClassName =
    themeConfig.backButtonPosition === "near-next-button"
      ? "bottom-8 left-1/2 -translate-x-[calc(50%+4.5rem)]"
      : "left-3 top-[68px] sm:left-4 sm:top-[72px]";
  const coverContainerClassName = "min-h-[calc(100vh-56px)]";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        pageMenuRef.current &&
        !pageMenuRef.current.contains(event.target as Node)
      ) {
        setIsPageMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const scrollPreviewToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const moveToNext = (skipValidation = false) => {
    if (!section) return;

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
      scrollPreviewToTop();
      return;
    }

    setSubmittedEndingSectionId(nextTarget.kind === "ending" ? nextTarget.sectionId ?? null : null);
    setCelebrationKey((prev) => prev + 1);
    setSubmitted(true);
    scrollPreviewToTop();
  };

  const handleBack = () => {
    setErrors({});
    setDirection(-1);
    setSectionHistory((prev) => prev.slice(0, -1));
    scrollPreviewToTop();
  };

  const handleResetPreview = () => {
    pendingFilesRef.current = {};
    setAnswers({});
    setOtherTexts({});
    setErrors({});
    setShakeIds(new Set());
    setSectionHistory([0]);
    setSubmitted(false);
    setSubmittedEndingSectionId(null);
    setCelebrationKey(0);
    scrollPreviewToTop();
  };

  const handleSelectPreviewSection = (targetIndex: number) => {
    const targetSection = sections[targetIndex];
    if (!targetSection) return;

    setIsPageMenuOpen(false);
    setErrors({});
    setShakeIds(new Set());
    setDirection(targetIndex >= displayedSectionIndex ? 1 : -1);
    setSectionHistory([targetIndex]);

    if ((targetSection.pageType ?? "page") === "ending") {
      setSubmitted(true);
      setSubmittedEndingSectionId(targetSection.id);
      setCelebrationKey(0);
    } else {
      setSubmitted(false);
      setSubmittedEndingSectionId(null);
      setCelebrationKey(0);
    }

    scrollPreviewToTop();
  };

  const navigateBackToBuilder = () =>
    navigate(`/forms/${id}/edit`, {
      state: { sections, formTitle, formDescription, bannerColor, bannerImage, theme: themeValue },
      replace: true,
    });

  return (
    <div className="min-h-screen" style={{ background: themeConfig.canvasBg }}>
      <RuntimeProgressBar value={progressPercent} themeConfig={themeConfig} />
      <header className="sticky top-0 z-60 border-b border-gray-200/80 bg-white/95 backdrop-blur">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={navigateBackToBuilder}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              aria-label="Back to editor"
            >
              <HouseIcon size={16} weight="bold" />
            </button>
            <p className="truncate text-sm font-semibold text-gray-900">
              {formTitle}
            </p>
            <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600 sm:inline-flex">
              Preview
            </span>
          </div>

          <div />

          <div className="flex items-center justify-end gap-2">
            {activeSectionOption ? (
              <div ref={pageMenuRef} className="relative">
                <button
                  onClick={() => setIsPageMenuOpen((open) => !open)}
                  className={`flex h-9 min-w-[168px] max-w-[220px] cursor-pointer items-center rounded-lg border bg-white px-3 transition-colors ${
                    isPageMenuOpen
                      ? "border-primary-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${PAGE_TYPE_BADGE_CLASS[activeSectionOption.pageType]}`}
                  >
                    {PAGE_TYPE_ICONS[activeSectionOption.pageType]}
                  </span>
                  <span className="flex-1 truncate text-left text-sm text-gray-700">
                    {activeSectionOption.label}
                  </span>
                  <CaretDownIcon
                    size={12}
                    className={`ml-auto shrink-0 text-gray-400 transition-transform ${
                      isPageMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isPageMenuOpen ? (
                    <PageMenuDropdown
                      activeId={activeSectionOption?.sectionId}
                      className="absolute right-0 top-full z-70 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-sm"
                      options={previewSectionMenuOptions}
                      variant="field"
                      onSelect={(sectionId) => {
                        const targetOption = previewSectionOptions.find(
                          (option) => option.sectionId === sectionId,
                        );
                        if (targetOption) {
                          handleSelectPreviewSection(targetOption.index);
                        }
                      }}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
            ) : null}

            <button
              onClick={navigateBackToBuilder}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 cursor-pointer"
            >
              <XIcon size={12} weight="bold" />
              <span className="hidden sm:inline">Exit preview</span>
            </button>
          </div>
        </div>
      </header>

      {submitted ? (
        <>
          <SubmissionCelebration
            celebrationKey={celebrationKey}
            className="min-h-[calc(100vh-56px)]"
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
                onFillAgain={handleResetPreview}
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
        </>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${section?.id ?? "empty"}-${submitted ? "submitted" : "active"}`}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {section?.pageType === "cover" ? (
                <RuntimeCoverPagePreview
                  containerClassName={coverContainerClassName}
                  section={section}
                  themeConfig={themeConfig}
                  onStart={() => moveToNext(true)}
                />
              ) : section ? (
                <RuntimeFormPagePreview
                  answers={answers}
                  backButtonClassName={previewBackButtonClassName}
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
                  nextButtonLabel={
                    nextTarget.kind === "section" ? "Next" : "Submit"
                  }
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
        </>
      )}
    </div>
  );
}
