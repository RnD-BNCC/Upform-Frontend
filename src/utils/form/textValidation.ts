import type { FormField, FormAnswerValue } from "@/types/form";
import { stripHtmlToText } from "./referenceTokens";
import { parsePhoneAnswer } from "./phoneAnswer";

function getTextValue(value: FormAnswerValue | undefined) {
  if (Array.isArray(value) || value === undefined) {
    return "";
  }

  if (!value.trim()) {
    return "";
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.values(parsed)
        .filter((entry): entry is string => typeof entry === "string")
        .join(" ")
        .trim();
    }
  } catch {
    // Non-JSON text values continue through the normal text path.
  }

  return stripHtmlToText(value).trim();
}

function getPatternError(
  pattern: string | undefined,
  value: string,
  emailDomain?: string,
): string | undefined {
  if (!pattern || pattern === "none") {
    return undefined;
  }

  if (pattern === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address.";
    }

    const normalizedDomain = emailDomain?.trim();
    if (!normalizedDomain) {
      return undefined;
    }

    const requiredSuffix = normalizedDomain.startsWith("@")
      ? normalizedDomain
      : `@${normalizedDomain}`;

    return value.toLowerCase().endsWith(requiredSuffix.toLowerCase())
      ? undefined
      : `Please enter an email ending with ${requiredSuffix}.`;
  }

  if (pattern === "url") {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:"
        ? undefined
        : "Please enter a valid URL.";
    } catch {
      return "Please enter a valid URL.";
    }
  }

  if (pattern === "number") {
    return /^-?\d+(\.\d+)?$/.test(value)
      ? undefined
      : "Please enter numbers only.";
  }

  try {
    return new RegExp(pattern).test(value)
      ? undefined
      : "Please enter a valid value.";
  } catch {
    return undefined;
  }
}

export function getTextValidationMessage(
  field: Pick<
    FormField,
    | "required"
    | "type"
    | "validationErrorMessage"
    | "validationEmailDomain"
    | "validationMaxLength"
    | "validationMessage"
    | "validationMinLength"
    | "validationPattern"
  >,
  value: FormAnswerValue | undefined,
) {
  const textValue =
    field.type === "phone" ? parsePhoneAnswer(value).number : getTextValue(value);

  if (!textValue) {
    return field.required
      ? field.validationMessage || "This question is required."
      : undefined;
  }

  if (
    typeof field.validationMinLength === "number" &&
    textValue.length < field.validationMinLength
  ) {
    return (
      field.validationErrorMessage ||
      `Please enter at least ${field.validationMinLength} characters.`
    );
  }

  if (
    typeof field.validationMaxLength === "number" &&
    textValue.length > field.validationMaxLength
  ) {
    return (
      field.validationErrorMessage ||
      `Please enter no more than ${field.validationMaxLength} characters.`
    );
  }

  const patternError = getPatternError(
    field.validationPattern ?? (field.type === "email" ? "email" : undefined),
    textValue,
    field.validationEmailDomain,
  );

  return patternError
    ? field.validationErrorMessage || patternError
    : undefined;
}
