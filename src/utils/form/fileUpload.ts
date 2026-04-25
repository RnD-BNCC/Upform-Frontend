import type { FormField } from "@/types/form";

export function getFileUploadCount(value: string | string[] | undefined): number {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string" && entry.trim()).length;
  }

  return typeof value === "string" && value.trim() ? 1 : 0;
}

export function getFileUploadValidationMessage(
  field: Pick<
    FormField,
    | "maxFileCount"
    | "minFileCount"
    | "required"
    | "validationErrorMessage"
    | "validationMessage"
  >,
  fileCount: number,
): string | undefined {
  if (fileCount === 0) {
    return field.required
      ? field.validationMessage || "This question is required."
      : undefined;
  }

  const belowMin =
    typeof field.minFileCount === "number" && fileCount < field.minFileCount;
  const aboveMax =
    typeof field.maxFileCount === "number" && fileCount > field.maxFileCount;

  if (belowMin || aboveMax) {
    return field.validationErrorMessage || "Please upload the required files.";
  }

  return undefined;
}
