import type { FormCalculation, FormField } from "@/types/form";
import { evaluateReferenceConditionTree } from "./referenceTokens";

type FieldVisibilityContext = {
  answers?: Record<string, string | string[]>;
  calculations?: FormCalculation[];
};

export function isFieldVisible(
  field: FormField,
  context: FieldVisibilityContext = {},
) {
  if (field.hideAlways) return false;
  if (!field.conditionTree?.items.length) return true;

  const matchesCondition = evaluateReferenceConditionTree(
    field.conditionTree,
    context,
  );

  return (field.conditionMode ?? "show") === "hide"
    ? !matchesCondition
    : matchesCondition;
}

export function getVisibleFields(
  fields: FormField[],
  context: FieldVisibilityContext = {},
) {
  return fields.filter((field) => isFieldVisible(field, context));
}
