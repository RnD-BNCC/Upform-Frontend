export function normalizeGroupedNumberInput(value: string) {
  const compact = value.replace(/\s/g, "").trim();
  if (!compact) return "";

  const sign = compact.startsWith("-") ? "-" : "";
  const unsigned = compact.replace(/-/g, "");
  const commaIndex = unsigned.lastIndexOf(",");
  const dotIndex = unsigned.lastIndexOf(".");
  const decimalSeparator =
    commaIndex > dotIndex
      ? ","
      : dotIndex >= 0 && !/^\d{1,3}(?:\.\d{3})+$/.test(unsigned)
        ? "."
        : "";

  const [integerSource = "", decimalSource = ""] = decimalSeparator
    ? unsigned.split(decimalSeparator)
    : [unsigned, ""];
  const integerDigits = integerSource.replace(/\D/g, "");
  const decimalDigits = decimalSource.replace(/\D/g, "");

  if (!integerDigits && !decimalSeparator) return "";

  return `${sign}${integerDigits || "0"}${
    decimalSeparator ? `.${decimalDigits}` : ""
  }`;
}

export function formatGroupedNumberInput(value?: string) {
  const normalized = normalizeGroupedNumberInput(value ?? "");
  if (!normalized) return "";

  const sign = normalized.startsWith("-") ? "-" : "";
  const unsigned = sign ? normalized.slice(1) : normalized;
  const hasDecimal = unsigned.includes(".");
  const [integerPart = "", decimalPart = ""] = unsigned.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${sign}${formattedInteger}${hasDecimal ? `,${decimalPart}` : ""}`;
}

export function isPlainNumberInput(value?: string) {
  return Boolean(value && !/<[^>]+>/.test(value) && /^-?[\d\s.,]+$/.test(value));
}
