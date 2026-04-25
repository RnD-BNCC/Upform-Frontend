import type { RefObject } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { FormCalculation, FormField, FormSection } from "@/types/form";
import { buildRows } from "@/utils/form/formBuilder";
import { getVisibleFields } from "@/utils/form";
import type { ThemeConfig } from "@/utils/form/themeConfig";
import PreviewField from "./PreviewField";
import ThemeFormLayout from "./ThemeFormLayout";

type Props = {
  answers: Record<string, string | string[]>;
  backButtonClassName?: string;
  calculations: FormCalculation[];
  emptyMessage: string;
  errors: Record<string, string>;
  fieldsRef: RefObject<Record<string, HTMLDivElement | null>>;
  isSubmittedView?: boolean;
  isLightTheme?: boolean;
  nextButtonLabel?: string;
  onAnimationComplete: (fieldId: string) => void;
  onAnswer: (fieldId: string, value: string | string[]) => void;
  onBack?: () => void;
  onFillAgain?: () => void;
  onNext?: () => void;
  onOtherTextChange: (fieldId: string, text: string) => void;
  onSkip?: () => void;
  otherTexts: Record<string, string>;
  pendingFilesRef?: RefObject<Record<string, File[]>>;
  section: FormSection;
  showBack?: boolean;
  shakeIds: Set<string>;
  themeConfig: ThemeConfig;
};

function getRuntimeActionField(
  field: FormField,
  isSubmittedView: boolean | undefined,
  nextButtonLabel: string,
) {
  if (field.type !== "next_button" || field.label) return field;

  return {
    ...field,
    label: isSubmittedView ? "Submit" : nextButtonLabel,
  };
}

export default function RuntimeSectionFields({
  answers,
  backButtonClassName = "left-3 top-3 sm:left-4 sm:top-4",
  calculations,
  emptyMessage,
  errors,
  fieldsRef,
  isSubmittedView,
  nextButtonLabel = "Next",
  onAnimationComplete,
  onAnswer,
  onBack,
  onFillAgain,
  onNext,
  onOtherTextChange,
  onSkip,
  otherTexts,
  pendingFilesRef,
  section,
  showBack = false,
  shakeIds,
  themeConfig,
}: Props) {
  const visibleFields = getVisibleFields(section.fields, { answers, calculations });
  const rows = buildRows(visibleFields);

  return (
    <>
      {showBack && onBack ? (
        <div className={`fixed z-40 ${backButtonClassName}`}>
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center text-gray-700 transition-colors hover:text-gray-900 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </button>
        </div>
      ) : null}

      <ThemeFormLayout
        pageType={(section.pageType ?? "page") === "ending" ? "ending" : "page"}
        surfaceClassName="scheme-light rounded-xl bg-white p-4 sm:p-6"
        themeConfig={themeConfig}
      >
        {rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="theme-field-stack flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.map((field) => field.id).join("+")}
                className="theme-field-row flex w-full flex-col gap-2 sm:flex-row"
              >
                {row.map((field) => {
                  const runtimeField = getRuntimeActionField(
                    field,
                    isSubmittedView,
                    nextButtonLabel,
                  );

                  return (
                    <div
                      key={field.id}
                      className={
                        row.length === 2
                          ? "min-w-0 flex-1"
                          : field.fieldWidth === "half"
                            ? "w-full sm:w-1/2"
                            : "w-full"
                      }
                    >
                      <PreviewField
                        answers={answers}
                        calculations={calculations}
                        errorMessage={errors[field.id]}
                        field={runtimeField}
                        hasError={!!errors[field.id]}
                        isShaking={shakeIds.has(field.id)}
                        otherText={otherTexts[field.id] ?? ""}
                        pendingFilesRef={pendingFilesRef}
                        value={answers[field.id]}
                        onAnswer={(value) => {
                          if (runtimeField.type === "next_button") {
                            if (value === "__skip__") {
                              onSkip?.();
                              return;
                            }
                            onNext?.();
                            return;
                          }

                          if (runtimeField.type === "fill_again_button") {
                            if (value === "fill_again") {
                              onFillAgain?.();
                              return;
                            }
                          }

                          onAnswer(field.id, value);
                        }}
                        onOtherTextChange={(text) =>
                          onOtherTextChange(field.id, text)
                        }
                        onAnimationComplete={() => onAnimationComplete(field.id)}
                        setRef={(element) => {
                          fieldsRef.current[field.id] = element;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ThemeFormLayout>
    </>
  );
}
