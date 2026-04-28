import type { FormAnswerValue } from "@/types/form";
import { getCountryByCode } from "@/constants";

export type PhoneAnswer = {
  countryCode: string;
  number: string;
};

export function sanitizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function parsePhoneAnswer(
  value: FormAnswerValue | undefined,
  fallbackCountryCode = "US",
): PhoneAnswer {
  const fallback = fallbackCountryCode || "US";

  if (Array.isArray(value)) {
    return { countryCode: fallback, number: sanitizePhoneNumber(value.join("")) };
  }

  if (!value?.trim()) {
    return { countryCode: fallback, number: "" };
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Partial<PhoneAnswer> & {
        phone?: string;
        value?: string;
      };
      return {
        countryCode:
          typeof record.countryCode === "string" && record.countryCode.trim()
            ? record.countryCode
            : fallback,
        number: sanitizePhoneNumber(
          typeof record.number === "string"
            ? record.number
            : typeof record.phone === "string"
              ? record.phone
              : typeof record.value === "string"
                ? record.value
                : "",
        ),
      };
    }
  } catch {
    // Existing responses may be plain phone strings.
  }

  return { countryCode: fallback, number: sanitizePhoneNumber(value) };
}

export function serializePhoneAnswer(answer: PhoneAnswer) {
  return JSON.stringify({
    countryCode: answer.countryCode || "US",
    number: sanitizePhoneNumber(answer.number),
  });
}

export function isSerializedPhoneAnswer(value: FormAnswerValue | undefined) {
  if (Array.isArray(value) || !value?.trim()) return false;

  try {
    const parsed = JSON.parse(value) as unknown;
    return (
      !!parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      ("countryCode" in parsed || "number" in parsed) &&
      ("number" in parsed || "phone" in parsed || "value" in parsed)
    );
  } catch {
    return false;
  }
}

export function formatPhoneAnswer(
  value: FormAnswerValue | undefined,
  fallbackCountryCode = "US",
) {
  const answer = parsePhoneAnswer(value, fallbackCountryCode);
  if (!answer.number) return "";

  const country = getCountryByCode(answer.countryCode);
  const countryLabel = country
    ? `${country.name} (${country.dial})`
    : answer.countryCode;

  return `${countryLabel} ${answer.number}`;
}

export function isPhoneAnswerEmpty(
  value: FormAnswerValue | undefined,
  fallbackCountryCode = "US",
) {
  return !parsePhoneAnswer(value, fallbackCountryCode).number;
}
