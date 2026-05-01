import type { FormField } from "@/types/form";

export function parseOptionIndexes(value?: string): number[] {
  const seen = new Set<number>();

  return (value ?? "")
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((index) => Number.isInteger(index) && index > 0)
    .filter((index) => {
      if (seen.has(index)) return false;
      seen.add(index);
      return true;
    });
}

export function formatOptionIndexes(indexes: number[]): string | undefined {
  const normalized = Array.from(
    new Set(indexes.filter((index) => Number.isInteger(index) && index > 0)),
  ).sort((a, b) => a - b);

  return normalized.length ? normalized.join(", ") : undefined;
}

export function getIndexedOptionValues(
  options: string[] | undefined,
  value?: string,
): string[] {
  const list = options ?? [];

  return parseOptionIndexes(value)
    .map((index) => list[index - 1])
    .filter((option): option is string => Boolean(option));
}

export function getSelectionCount(value: string | string[] | undefined): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value.trim()) return 1;
  return 0;
}

export function getSelectionValidationMessage(
  field: Pick<
    FormField,
    | "required"
    | "validationMessage"
    | "validationMinSelection"
    | "validationMaxSelection"
    | "validationErrorMessage"
  >,
  selectionCount: number,
): string | undefined {
  if (selectionCount === 0) {
    return field.required
      ? field.validationMessage || "This question is required."
      : undefined;
  }

  const belowMin =
    typeof field.validationMinSelection === "number" &&
    selectionCount < field.validationMinSelection;
  const aboveMax =
    typeof field.validationMaxSelection === "number" &&
    selectionCount > field.validationMaxSelection;

  if (belowMin || aboveMax) {
    return (
      field.validationErrorMessage ||
      "Please select the required number of options"
    );
  }

  return undefined;
}
