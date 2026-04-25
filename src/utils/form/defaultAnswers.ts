import type { FormCalculation, FormField, FormSection } from "@/types/form";
import { getIndexedOptionValues } from "./optionSelection";
import { resolveReferenceText } from "./referenceTokens";

type RuntimeDefaultContext = {
  answers?: Record<string, string | string[]>;
  calculations?: FormCalculation[];
};

const DISPLAY_ONLY_FIELD_TYPES = new Set<FormField["type"]>([
  "banner_block",
  "divider",
  "fill_again_button",
  "image_block",
  "next_button",
  "paragraph",
  "thank_you_block",
  "title_block",
  "url_button",
]);

function getResolvedTextDefault(
  field: FormField,
  context?: RuntimeDefaultContext,
) {
  const value = resolveReferenceText(field.defaultValue, {
    answers: context?.answers,
    calculations: context?.calculations,
  }).trim();

  return value || undefined;
}

export function getRuntimeDefaultAnswer(
  field: FormField,
  context?: RuntimeDefaultContext,
): string | string[] | undefined {
  if (DISPLAY_ONLY_FIELD_TYPES.has(field.type)) {
    return undefined;
  }

  if (field.type === "multiple_choice") {
    return getIndexedOptionValues(field.options, field.defaultValue)[0];
  }

  if (field.type === "checkbox" || field.type === "multiselect") {
    const defaults = getIndexedOptionValues(field.options, field.defaultValue);
    return defaults.length > 0 ? defaults : undefined;
  }

  if (field.type === "address") {
    const defaults = field.addressSubDefaults ?? {};
    const hasDefault = Object.values(defaults).some((value) => value?.trim());

    return hasDefault ? JSON.stringify(defaults) : undefined;
  }

  return getResolvedTextDefault(field, context);
}

export function getAnswersWithRuntimeDefaults(
  sections: FormSection[],
  answers: Record<string, string | string[]>,
  calculations?: FormCalculation[],
) {
  const nextAnswers = { ...answers };

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (nextAnswers[field.id] !== undefined) {
        return;
      }

      const defaultAnswer = getRuntimeDefaultAnswer(field, {
        answers: nextAnswers,
        calculations,
      });

      if (defaultAnswer !== undefined) {
        nextAnswers[field.id] = defaultAnswer;
      }
    });
  });

  return nextAnswers;
}
