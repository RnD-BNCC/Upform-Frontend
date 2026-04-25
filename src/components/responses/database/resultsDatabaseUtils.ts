import type { FormField, FormResponse } from "@/types/form";
import { cleanResultLabel, isResultField } from "../resultsResponseUtils";
import type {
  ResultDatabaseView,
  ResultFieldColumn,
  ResultFilterCondition,
  ResultFilterGroup,
  ResultFilterNode,
  ResultFilterOperator,
  ResultSortRule,
  ResultsAnswerValue,
} from "@/types/results";

export const RESULT_VIEW_STORAGE_PREFIX = "upform:results:views:";

export const DEFAULT_FILTER_GROUP: ResultFilterGroup = {
  id: "root",
  type: "group",
  logic: "and",
  items: [],
};

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function toStableResponseUuid(response: FormResponse) {
  const explicitUuid = response.respondentUuid ?? response.uuid;
  if (explicitUuid) return explicitUuid;

  const seed = `${response.id}:${response.submittedAt || response.updatedAt || response.startedAt || ""}`;
  const first = hashString(seed);
  const second = hashString(`${seed}:upform`);
  const third = hashString(`${seed}:response`);
  const fourth = hashString(`${seed}:respondent`);

  return `${first.slice(0, 8)}-${second.slice(0, 4)}-4${second.slice(5, 8)}-${(
    parseInt(third.slice(0, 2), 16) & 0x3f | 0x80
  )
    .toString(16)
    .padStart(2, "0")}${third.slice(2, 4)}-${third.slice(4, 8)}${fourth}`;
}

export function getDatabaseFields(fields: FormField[]) {
  return fields.filter(isResultField);
}

export function createFieldColumns(fields: FormField[]): ResultFieldColumn[] {
  return getDatabaseFields(fields).map((field) => ({
    id: field.id,
    label: cleanResultLabel(field.label),
    type: field.type,
    width: field.type === "paragraph" || field.type === "address" ? 260 : 220,
  }));
}

export function createDefaultView(fields: FormField[]): ResultDatabaseView {
  return {
    id: "test",
    name: "test",
    fieldOrder: fields.map((field) => field.id),
    hiddenFieldIds: [],
    sortRules: [],
    filterGroup: DEFAULT_FILTER_GROUP,
  };
}

export function normalizeView(
  view: ResultDatabaseView,
  fields: FormField[],
): ResultDatabaseView {
  const fieldIds = fields.map((field) => field.id);
  const knownIds = new Set(fieldIds);
  const order = [
    ...view.fieldOrder.filter((fieldId) => knownIds.has(fieldId)),
    ...fieldIds.filter((fieldId) => !view.fieldOrder.includes(fieldId)),
  ];

  return {
    ...view,
    fieldOrder: order,
    hiddenFieldIds: view.hiddenFieldIds.filter((fieldId) => knownIds.has(fieldId)),
    sortRules: view.sortRules.filter((rule) => knownIds.has(rule.fieldId)),
    filterGroup: normalizeFilterGroup(view.filterGroup, knownIds),
  };
}

export function normalizeViews(
  views: ResultDatabaseView[],
  fields: FormField[],
) {
  const fallback = createDefaultView(fields);
  const normalized = views.length > 0 ? views : [fallback];
  return normalized.map((view) => normalizeView(view, fields));
}

function normalizeFilterGroup(
  group: ResultFilterGroup | undefined,
  knownIds: Set<string>,
): ResultFilterGroup {
  if (!group) return DEFAULT_FILTER_GROUP;

  return {
    id: group.id || createId("filter-group"),
    type: "group",
    logic: group.logic === "or" ? "or" : "and",
    items: group.items
      .map((item) => {
        if (item.type === "group") {
          return normalizeFilterGroup(item, knownIds);
        }
        if (!knownIds.has(item.fieldId)) return null;
        return {
          id: item.id || createId("filter"),
          type: "condition" as const,
          fieldId: item.fieldId,
          operator: item.operator,
          value: item.value ?? "",
        };
      })
      .filter(Boolean) as ResultFilterNode[],
  };
}

export function getOrderedFields(
  fields: FormField[],
  fieldOrder: string[],
) {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  return [
    ...fieldOrder
      .map((fieldId) => fieldById.get(fieldId))
      .filter(Boolean) as FormField[],
    ...fields.filter((field) => !fieldOrder.includes(field.id)),
  ];
}

export function countFilterConditions(node: ResultFilterNode): number {
  if (node.type === "condition") return 1;
  return node.items.reduce((count, item) => count + countFilterConditions(item), 0);
}

export function getAnswerValue(response: FormResponse, fieldId: string) {
  return response.answers[fieldId];
}

export function formatAnswerValue(value: ResultsAnswerValue) {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
}

export function isFieldValueEmpty(value: ResultsAnswerValue) {
  if (Array.isArray(value)) return value.length === 0;
  return !String(value ?? "").trim();
}

export function evaluateCondition(
  response: FormResponse,
  condition: ResultFilterCondition,
) {
  const rawValue = getAnswerValue(response, condition.fieldId);
  const value = formatAnswerValue(rawValue).toLowerCase();
  const expected = condition.value.trim().toLowerCase();

  if (condition.operator === "is_empty") return isFieldValueEmpty(rawValue);
  if (condition.operator === "is_filled") return !isFieldValueEmpty(rawValue);
  if (!expected) return true;
  if (condition.operator === "contains") return value.includes(expected);
  if (condition.operator === "not_contains") return !value.includes(expected);
  if (condition.operator === "equals") return value === expected;
  if (condition.operator === "not_equals") return value !== expected;
  return true;
}

export function evaluateFilterGroup(
  response: FormResponse,
  group: ResultFilterGroup,
): boolean {
  if (group.items.length === 0) return true;

  const results = group.items.map((item) =>
    item.type === "condition"
      ? evaluateCondition(response, item)
      : evaluateFilterGroup(response, item),
  );

  return group.logic === "and"
    ? results.every(Boolean)
    : results.some(Boolean);
}

export function applySortRules(
  responses: FormResponse[],
  sortRules: ResultSortRule[],
) {
  if (sortRules.length === 0) return responses;

  return [...responses].sort((a, b) => {
    for (const rule of sortRules) {
      const left = formatAnswerValue(getAnswerValue(a, rule.fieldId)).toLowerCase();
      const right = formatAnswerValue(getAnswerValue(b, rule.fieldId)).toLowerCase();
      const result = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      if (result !== 0) return rule.direction === "asc" ? result : -result;
    }
    return 0;
  });
}

export function getFieldIconLabel(field: FormField) {
  if (field.type === "email") return "@";
  if (field.type === "file_upload") return "paperclip";
  if (field.type === "number" || field.type === "currency") return "#";
  return "list";
}

export function getOperatorLabel(operator: ResultFilterOperator) {
  const labels: Record<ResultFilterOperator, string> = {
    contains: "contains",
    equals: "equals",
    is_empty: "is empty",
    is_filled: "is filled",
    not_contains: "does not contain",
    not_equals: "does not equal",
  };
  return labels[operator];
}

export function parseStoredViews(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as {
      activeViewId?: string;
      views?: ResultDatabaseView[];
    };
    if (!Array.isArray(parsed.views)) return null;
    return parsed;
  } catch {
    return null;
  }
}
