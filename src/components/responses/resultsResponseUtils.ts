import type {
  FormField,
  FormResponse,
  FormResponseProgress,
  RespondentDeviceType,
} from "@/types/form";

const RESULT_FIELD_TYPES = new Set<FormField["type"]>([
  "address",
  "checkbox",
  "currency",
  "date",
  "dropdown",
  "email",
  "file_upload",
  "linear_scale",
  "long_text",
  "multiple_choice",
  "multiselect",
  "number",
  "opinion_scale",
  "phone",
  "ranking",
  "rating",
  "rich_text",
  "short_text",
  "single_checkbox",
  "time",
]);

const HTML_BREAK_PATTERN = /<br\s*\/?>/gi;
const HTML_TAG_PATTERN = /<[^>]*>/g;

export function cleanResultLabel(value?: string) {
  const text = (value ?? "")
    .replace(HTML_BREAK_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Untitled field";
}

export function isResultField(field: FormField) {
  return RESULT_FIELD_TYPES.has(field.type);
}

export function getResultFields(fields: FormField[]) {
  return fields.filter(isResultField);
}

export function getResponseTimestamp(response: FormResponse) {
  return (
    response.submittedAt ||
    response.completedAt ||
    response.updatedAt ||
    response.startedAt ||
    new Date(0).toISOString()
  );
}

export function getProgressTimestamp(progress: FormResponseProgress) {
  return progress.updatedAt || progress.startedAt || new Date(0).toISOString();
}

export function toDatabaseProgressResponse(
  progress: FormResponseProgress,
): FormResponse {
  return {
    id: progress.id,
    answers: progress.answers,
    currentSectionId: progress.currentSectionId,
    currentSectionIndex: progress.currentSectionIndex,
    deviceType: progress.deviceType,
    progressPercent: progress.progressPercent,
    respondentUuid: progress.respondentUuid ?? progress.uuid,
    sectionHistory: progress.sectionHistory,
    startedAt: progress.startedAt,
    status: "in_progress",
    submittedAt: getProgressTimestamp(progress),
    updatedAt: progress.updatedAt,
    userAgent: progress.userAgent,
    uuid: progress.uuid,
  };
}

export function withSubmittedStatus(response: FormResponse): FormResponse {
  return {
    ...response,
    status: response.status ?? "submitted",
  };
}

export function inferDeviceType(userAgent?: string): RespondentDeviceType {
  const agent = (userAgent ?? "").toLowerCase();
  if (!agent) return "unknown";
  if (/ipad|tablet|kindle|silk/.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/.test(agent)) return "mobile";
  return "desktop";
}

export function getResponseDeviceType(
  response: Pick<FormResponse, "deviceType" | "userAgent">,
) {
  return response.deviceType ?? inferDeviceType(response.userAgent);
}

export function getProgressDeviceType(progress: FormResponseProgress) {
  return progress.deviceType ?? inferDeviceType(progress.userAgent);
}
