import type {
  CalculationDurationUnit,
  CalculationRule,
  ConditionGroup,
  ConditionLeaf,
  FormCalculation,
  FormField,
  FormSection,
} from "@/types/form";
import {
  type ConditionFieldGroup,
  CONDITION_FIELD_TYPE_LABELS,
  getAvailableReferenceFieldGroupsForField as getReferenceFieldGroupsForField,
  getAvailableReferenceFieldsForField as getReferenceFieldsForField,
} from "./conditionFields";

export const REFERENCE_TOKEN_SELECTOR = '[data-reference-token="true"]';

export type ReferencePickerTabId =
  | "pagesAndWidgets"
  | "urlParams"
  | "calculations"
  | "dateUtilities"
  | "enrichment";

export type DateReferenceKind =
  | "today"
  | "yesterday"
  | "tomorrow"
  | "one_month_from_now"
  | "days_from_now"
  | "days_ago";

export type DateReferenceOption = {
  id: DateReferenceKind;
  label: string;
  requiresAmount?: boolean;
};

export type ReferenceResolveContext = {
  answers?: Record<string, string | string[]>;
  calculations?: FormCalculation[];
  calculationCache?: Map<string, string>;
  calculationStack?: string[];
  preserveFallbackLabels?: boolean;
  preserveFallbackTokensAsHtml?: boolean;
  now?: Date;
};

export const DATE_REFERENCE_OPTIONS: DateReferenceOption[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "one_month_from_now", label: "One month from now" },
  { id: "days_from_now", label: "N days from now", requiresAmount: true },
  { id: "days_ago", label: "N days ago", requiresAmount: true },
];

const REFERENCE_TOKEN_CLASSNAME =
  "inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[12px] font-medium text-blue-600 align-baseline";

function formatReferenceDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(baseDate: Date, months: number) {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return next;
}

function normalizeAnswerValue(value: string | string[]): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeAnswerValue(entry))
      .filter(Boolean)
      .join(", ");
  }

  if (!value) return "";

  if (value.includes("::")) {
    return value.split("::")[0] ?? value;
  }

  if (value.startsWith("__other__:")) {
    return value.slice("__other__:".length);
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, string>;
      return Object.values(parsed).filter(Boolean).join(", ");
    } catch {
      return value;
    }
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function stripHtmlToText(value?: string) {
  if (!value) return "";

  if (typeof document === "undefined") {
    return value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  }

  const container = document.createElement("div");
  container.innerHTML = value;
  return container.textContent?.trim() ?? "";
}

export function getReferenceFieldLabel(field: FormField) {
  const plainLabel = stripHtmlToText(field.label);
  return plainLabel || CONDITION_FIELD_TYPE_LABELS[field.type] || field.type;
}

export function getReferenceCalculationLabel(calculation: FormCalculation) {
  return calculation.name?.trim() || "Calculation";
}

function findDateReferenceOption(kind: DateReferenceKind) {
  return DATE_REFERENCE_OPTIONS.find((option) => option.id === kind);
}

export function getDateReferenceLabel(
  optionOrKind: DateReferenceOption | DateReferenceKind,
  amount?: number,
) {
  const option =
    typeof optionOrKind === "string"
      ? findDateReferenceOption(optionOrKind)
      : optionOrKind;

  if (!option) return "Date";

  if (!option.requiresAmount || !amount) {
    return option.label;
  }

  return option.id === "days_ago"
    ? `${amount} days ago`
    : `${amount} days from now`;
}

export function getAvailableReferenceFieldsForField(
  sections: FormSection[],
  fieldId: string,
) {
  return getReferenceFieldsForField(sections, fieldId);
}

export function getAvailableReferenceFieldGroupsForField(
  sections: FormSection[],
  fieldId: string,
): ConditionFieldGroup[] {
  return getReferenceFieldGroupsForField(sections, fieldId);
}

export function decorateReferenceTokenElement(element: HTMLElement) {
  if (element.getAttribute("data-reference-token") !== "true") return;

  element.setAttribute("contenteditable", "false");
  element.setAttribute("spellcheck", "false");
  element.className = REFERENCE_TOKEN_CLASSNAME;

  const label = element.dataset.referenceLabel ?? "";
  if (label) {
    element.textContent = `@${label}`;
  }
}

export function hydrateReferenceTokenElements(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(REFERENCE_TOKEN_SELECTOR)
    .forEach((element) => decorateReferenceTokenElement(element));
}

export function createFieldReferenceTokenHtml(field: FormField) {
  const label = getReferenceFieldLabel(field);

  return `<span data-reference-token="true" data-reference-kind="field" data-reference-id="${escapeHtml(
    field.id,
  )}" data-reference-label="${escapeHtml(
    label,
  )}" contenteditable="false" spellcheck="false" class="${REFERENCE_TOKEN_CLASSNAME}">@${escapeHtml(
    label,
  )}</span>`;
}

export function createDateReferenceTokenHtml(
  option: DateReferenceOption,
  amount?: number,
) {
  const label = getDateReferenceLabel(option, amount);

  return `<span data-reference-token="true" data-reference-kind="date" data-reference-date-kind="${escapeHtml(
    option.id,
  )}" data-reference-label="${escapeHtml(
    label,
  )}"${amount ? ` data-reference-amount="${amount}"` : ""} contenteditable="false" spellcheck="false" class="${REFERENCE_TOKEN_CLASSNAME}">@${escapeHtml(
    label,
  )}</span>`;
}

export function createCalculationReferenceTokenHtml(
  calculation: FormCalculation,
) {
  const label = getReferenceCalculationLabel(calculation);

  return `<span data-reference-token="true" data-reference-kind="calculation" data-reference-calculation-id="${escapeHtml(
    calculation.id,
  )}" data-reference-label="${escapeHtml(
    label,
  )}" contenteditable="false" spellcheck="false" class="${REFERENCE_TOKEN_CLASSNAME}">@${escapeHtml(
    label,
  )}</span>`;
}

function createFallbackReferenceValue(
  fallbackLabel: string,
  context: ReferenceResolveContext,
) {
  if (context.preserveFallbackLabels && context.preserveFallbackTokensAsHtml) {
    return null;
  }

  return context.preserveFallbackLabels ? `@${fallbackLabel}` : "";
}

function normalizeConditionComparableValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (Number.isFinite(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return trimmed.toLowerCase();
}

function getNormalizedAnswerValues(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeConditionComparableValue(normalizeAnswerValue(entry)))
      .filter(Boolean);
  }

  const normalized = normalizeConditionComparableValue(
    normalizeAnswerValue(value ?? ""),
  );
  return normalized ? [normalized] : [];
}

function normalizeResolvedConditionValue(
  value: string | undefined,
  context: ReferenceResolveContext,
) {
  return normalizeConditionComparableValue(
    normalizeAnswerValue(resolveReferenceText(value, context)),
  );
}

function splitResolvedConditionValues(
  value: string | undefined,
  context: ReferenceResolveContext,
) {
  return normalizeAnswerValue(resolveReferenceText(value, context))
    .split(",")
    .map((entry) => normalizeConditionComparableValue(entry))
    .filter(Boolean);
}

function matchesReferenceConditionLeaf(
  leaf: ConditionLeaf,
  context: ReferenceResolveContext,
) {
  const answer = resolveConditionLeafSourceValue(leaf, context);
  const answerValues = getNormalizedAnswerValues(answer);
  const normalizedValue = normalizeResolvedConditionValue(leaf.value, context);
  const comparisonValues = splitResolvedConditionValues(leaf.value, context);

  switch (leaf.operator) {
    case "is_filled":
      return answerValues.length > 0;
    case "is_empty":
      return answerValues.length === 0;
    case "equals":
      if (Array.isArray(answer)) {
        if (comparisonValues.length === 0) return false;
        const left = [...answerValues].sort();
        const right = [...comparisonValues].sort();
        return (
          left.length === right.length &&
          left.every((value, index) => value === right[index])
        );
      }
      return answerValues[0] === normalizedValue;
    case "not_equals":
      if (Array.isArray(answer)) {
        if (comparisonValues.length === 0) return answerValues.length > 0;
        const left = [...answerValues].sort();
        const right = [...comparisonValues].sort();
        return (
          left.length !== right.length ||
          left.some((value, index) => value !== right[index])
        );
      }
      return answerValues[0] !== normalizedValue;
    case "contains":
      if (Array.isArray(answer)) {
        if (comparisonValues.length === 0) return false;
        return comparisonValues.some((value) => answerValues.includes(value));
      }
      return normalizedValue.length > 0 && answerValues[0]?.includes(normalizedValue);
    case "not_contains":
      if (Array.isArray(answer)) {
        if (comparisonValues.length === 0) return true;
        return comparisonValues.every((value) => !answerValues.includes(value));
      }
      return normalizedValue.length === 0 || !answerValues[0]?.includes(normalizedValue);
    default:
      return false;
  }
}

function resolveConditionLeafSourceValue(
  leaf: ConditionLeaf,
  context: ReferenceResolveContext,
) {
  const sourceKind = leaf.sourceKind ?? "field";

  if (sourceKind === "calculation") {
    return resolveCalculationValue(leaf.fieldId, context);
  }

  if (sourceKind === "date") {
    return resolveDateReferenceValue(
      leaf.fieldId as DateReferenceKind,
      leaf.sourceAmount,
      context,
    );
  }

  return context.answers?.[leaf.fieldId];
}

export function evaluateReferenceConditionTree(
  tree: ConditionGroup | undefined,
  context: ReferenceResolveContext,
): boolean {
  if (!tree || tree.items.length === 0) return false;

  const results = tree.items.map((item) =>
    item.type === "group"
      ? evaluateReferenceConditionTree(item, context)
      : matchesReferenceConditionLeaf(item, context),
  );

  return tree.logic === "or"
    ? results.some(Boolean)
    : results.every(Boolean);
}

function formatCalculatedNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  return String(Number.parseFloat(value.toFixed(6)));
}

function parseResolvedCalculationNumber(
  value: string | undefined,
  context: ReferenceResolveContext,
) {
  const normalized = resolveReferenceText(value, context)
    .replace(/,/g, "")
    .trim();

  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseResolvedDurationDate(
  value: string | undefined,
  context: ReferenceResolveContext,
) {
  const resolved = resolveReferenceText(value, context).trim();
  if (!resolved) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(resolved)) {
    const parsed = new Date(`${resolved}T00:00:00`);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  const timeMatch = resolved.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const baseDate = context.now ? new Date(context.now) : new Date();
    baseDate.setHours(
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      Number(timeMatch[3] ?? 0),
      0,
    );
    return Number.isFinite(baseDate.getTime()) ? baseDate : null;
  }

  const parsed = new Date(resolved);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function convertDurationMs(diffMs: number, unit: CalculationDurationUnit) {
  const minutes = diffMs / 60_000;

  switch (unit) {
    case "years":
      return minutes / (60 * 24 * 365);
    case "months":
      return minutes / (60 * 24 * 30);
    case "weeks":
      return minutes / (60 * 24 * 7);
    case "days":
      return minutes / (60 * 24);
    case "hours":
      return minutes / 60;
    case "minutes":
      return minutes;
    default:
      return minutes / (60 * 24);
  }
}

function resolveCalculationRuleValue(
  rule: CalculationRule,
  calculation: FormCalculation,
  context: ReferenceResolveContext,
  currentValue: number,
) {
  if (
    rule.conditionTree &&
    !evaluateReferenceConditionTree(rule.conditionTree, context)
  ) {
    return currentValue;
  }

  const nextValue = parseResolvedCalculationNumber(rule.value, context);
  if (nextValue === null) return currentValue;

  switch (rule.operation ?? "set") {
    case "set":
      return nextValue;
    case "subtract":
      return currentValue - nextValue;
    case "multiply":
      return currentValue * nextValue;
    case "divide":
      return nextValue === 0 ? currentValue : currentValue / nextValue;
    case "add":
      return currentValue + nextValue;
    default:
      return calculation.type === "number" ? currentValue : nextValue;
  }
}

function resolveCalculationTextValue(
  calculation: FormCalculation,
  context: ReferenceResolveContext,
) {
  let currentValue = resolveReferenceText(calculation.initialValue, context);

  for (const rule of calculation.rules ?? []) {
    if (
      rule.conditionTree &&
      !evaluateReferenceConditionTree(rule.conditionTree, context)
    ) {
      continue;
    }

    currentValue = resolveReferenceText(rule.value, context);
  }

  return currentValue;
}

function resolveCalculationDurationValue(
  calculation: FormCalculation,
  context: ReferenceResolveContext,
) {
  const startDate = parseResolvedDurationDate(
    calculation.durationStartValue,
    context,
  );
  const endDate = parseResolvedDurationDate(calculation.durationEndValue, context);

  if (!startDate || !endDate) return "";

  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  return formatCalculatedNumber(
    convertDurationMs(diffMs, calculation.durationUnit ?? "days"),
  );
}

function resolveCalculationValue(
  calculationId: string,
  context: ReferenceResolveContext,
) {
  if (!calculationId) return "";

  const cache = context.calculationCache ?? new Map<string, string>();
  if (!context.calculationCache) {
    context.calculationCache = cache;
  }

  if (cache.has(calculationId)) {
    return cache.get(calculationId) ?? "";
  }

  if ((context.calculationStack ?? []).includes(calculationId)) {
    return "";
  }

  const calculation = context.calculations?.find(
    (entry) => entry.id === calculationId,
  );
  if (!calculation) return "";

  const nextContext: ReferenceResolveContext = {
    ...context,
    calculationCache: cache,
    calculationStack: [...(context.calculationStack ?? []), calculationId],
  };

  const resolvedValue =
    calculation.type === "number"
      ? formatCalculatedNumber(
          (calculation.rules ?? []).reduce(
            (currentValue, rule) =>
              resolveCalculationRuleValue(
                rule,
                calculation,
                nextContext,
                currentValue,
              ),
            parseResolvedCalculationNumber(calculation.initialValue, nextContext) ?? 0,
          ),
        )
      : calculation.type === "duration"
        ? resolveCalculationDurationValue(calculation, nextContext)
        : resolveCalculationTextValue(calculation, nextContext);

  cache.set(calculationId, resolvedValue);
  return resolvedValue;
}

function resolveFieldReference(
  element: HTMLElement,
  context: ReferenceResolveContext,
) {
  const fieldId = element.dataset.referenceId ?? "";
  const fallbackLabel = element.dataset.referenceLabel ?? "";
  const answer = fieldId ? context.answers?.[fieldId] : undefined;
  const normalized = answer ? normalizeAnswerValue(answer) : "";

  if (normalized) return normalized;
  return createFallbackReferenceValue(fallbackLabel, context);
}

function resolveDateReference(
  element: HTMLElement,
  context: ReferenceResolveContext,
) {
  const kind = element.dataset.referenceDateKind as DateReferenceKind | undefined;
  const amount = Number(element.dataset.referenceAmount ?? "0");
  const fallbackLabel = element.dataset.referenceLabel ?? "";

  if (!kind) {
    return createFallbackReferenceValue(fallbackLabel, context);
  }

  return (
    resolveDateReferenceValue(kind, Number.isFinite(amount) ? amount : undefined, context) ??
    createFallbackReferenceValue(fallbackLabel, context)
  );
}

export function resolveDateReferenceValue(
  kind: DateReferenceKind,
  amount: number | undefined,
  context: ReferenceResolveContext,
) {
  const now = context.now ? new Date(context.now) : new Date();
  const numericAmount = typeof amount === "number" ? amount : 0;

  if (kind === "today") return formatReferenceDate(now);
  if (kind === "yesterday") return formatReferenceDate(addDays(now, -1));
  if (kind === "tomorrow") return formatReferenceDate(addDays(now, 1));
  if (kind === "one_month_from_now") {
    return formatReferenceDate(addMonths(now, 1));
  }
  if (kind === "days_from_now") {
    return formatReferenceDate(addDays(now, numericAmount));
  }
  if (kind === "days_ago") {
    return formatReferenceDate(addDays(now, -numericAmount));
  }

  return undefined;
}

function resolveCalculationReference(
  element: HTMLElement,
  context: ReferenceResolveContext,
) {
  const calculationId = element.dataset.referenceCalculationId ?? "";
  const fallbackLabel = element.dataset.referenceLabel ?? "";

  if (!calculationId || !context.calculations?.length) {
    return createFallbackReferenceValue(fallbackLabel, context);
  }

  const calculationExists = context.calculations.some(
    (calculation) => calculation.id === calculationId,
  );
  if (!calculationExists) {
    return createFallbackReferenceValue(fallbackLabel, context);
  }

  return resolveCalculationValue(calculationId, context);
}

export function resolveReferenceHtml(
  value: string | undefined,
  context: ReferenceResolveContext = {},
) {
  if (!value) return "";
  if (typeof document === "undefined") return value;

  const container = document.createElement("div");
  container.innerHTML = value;
  hydrateReferenceTokenElements(container);
  const nextContext: ReferenceResolveContext = {
    ...context,
    calculationCache: context.calculationCache ?? new Map<string, string>(),
    calculationStack: context.calculationStack ?? [],
  };

  container
    .querySelectorAll<HTMLElement>(REFERENCE_TOKEN_SELECTOR)
    .forEach((element) => {
      const kind = element.dataset.referenceKind;
      const resolved =
        kind === "date"
          ? resolveDateReference(element, context)
          : kind === "calculation"
            ? resolveCalculationReference(element, nextContext)
          : resolveFieldReference(element, context);
      if (resolved === null) {
        decorateReferenceTokenElement(element);
        return;
      }
      element.replaceWith(document.createTextNode(resolved));
    });

  return container.innerHTML;
}

export function resolveReferenceText(
  value: string | undefined,
  context: ReferenceResolveContext = {},
) {
  if (!value) return "";

  if (typeof document === "undefined") {
    return stripHtmlToText(value);
  }

  const container = document.createElement("div");
  container.innerHTML = resolveReferenceHtml(value, {
    ...context,
    calculationCache: context.calculationCache ?? new Map<string, string>(),
    calculationStack: context.calculationStack ?? [],
  });
  return container.textContent ?? "";
}
