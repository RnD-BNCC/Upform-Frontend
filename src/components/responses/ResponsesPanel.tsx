import { useState } from "react";
import {
  ChartBarIcon,
  ChartPieSliceIcon,
  ClockIcon,
  DatabaseIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useQueryAnalyticsEvents,
  useQueryResponseProgress,
  useQueryResponses,
} from "@/api/responses";
import { useMutationCreatePermissionRequest } from "@/api/permission-requests";
import { useQuerySubmitFormSettings } from "@/api/email-blasts";
import { QUERY_KEYS } from "@/api/queryKeys";
import type { FormField, FormResponse, FormSection } from "@/types/form";
import type { ResultsSection } from "@/types/results";
import type { ShareToast } from "@/types/builderShare";
import AnalyticsTab from "./analytics/AnalyticsTab";
import DatabaseView from "./database/DatabaseView";
import SummaryTab from "./SummaryTab";
import { getPermissionRequiredError } from "@/utils/permissionRequests";

interface ResponsesPanelProps {
  responses: FormResponse[];
  allFields: FormField[];
  eventId: string;
  sections: FormSection[];
  showToast?: ShareToast;
}

const RESULT_SECTIONS: Array<{
  key: ResultsSection;
  label: string;
  icon: typeof DatabaseIcon;
}> = [
  { key: "database", label: "Database", icon: DatabaseIcon },
  { key: "submissions", label: "Submissions", icon: FileTextIcon },
  { key: "inProgress", label: "In progress", icon: ClockIcon },
  { key: "summary", label: "Summary", icon: ChartPieSliceIcon },
  { key: "analytics", label: "Analytics", icon: ChartBarIcon },
];

export default function ResponsesPanel({
  responses,
  allFields,
  eventId,
  sections,
  showToast,
}: ResponsesPanelProps) {
  const [activeSection, setActiveSection] =
    useState<ResultsSection>("database");
  const queryClient = useQueryClient();
  const responsesQuery = useQueryResponses(eventId);
  const progressQuery = useQueryResponseProgress(eventId);
  const analyticsEventsQuery = useQueryAnalyticsEvents(eventId);
  const submitSettingsQuery = useQuerySubmitFormSettings(eventId, !!eventId);
  const createPermissionRequest = useMutationCreatePermissionRequest();
  const currentResponses = responsesQuery.data ?? responses;
  const progressResponses = progressQuery.data ?? [];
  const analyticsEvents = analyticsEventsQuery.data ?? [];
  const submitFormSettings = submitSettingsQuery.data ?? null;

  const refreshResults = () => {
    if (!eventId) return Promise.resolve();

    return Promise.all([
      responsesQuery.refetch(),
      progressQuery.refetch(),
      analyticsEventsQuery.refetch(),
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      }),
    ]).then(() => undefined);
  };

  const renderContent = () => {
    const permissionError = getPermissionRequiredError(responsesQuery.error);

    if (permissionError) {
      return (
        <div className="flex h-full items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-base font-bold text-gray-950">
              Permission required
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Your account needs approval before viewing respondent data for this form.
            </p>
            <button
              type="button"
              disabled={createPermissionRequest.isPending}
              onClick={() =>
                createPermissionRequest.mutate(
                  {
                    action: permissionError.action,
                    reason: "Need access to respondent data",
                    resourceId: permissionError.resourceId,
                    resourceType: permissionError.resourceType,
                  },
                  {
                    onSuccess: () =>
                      showToast?.("Permission request sent", "success"),
                    onError: () =>
                      showToast?.("Failed to request permission", "error"),
                  },
                )
              }
              className="mt-5 h-9 rounded-md bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {createPermissionRequest.isPending ? "Requesting..." : "Request permission"}
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === "database") {
      return (
        <DatabaseView
          key="database"
          allFields={allFields}
          eventId={eventId}
          mode="database"
          onRefresh={refreshResults}
          progressResponses={progressResponses}
          responses={currentResponses}
          sections={sections}
          showToast={showToast}
          submitFormSettings={submitFormSettings}
          title="My form database"
        />
      );
    }

    if (activeSection === "submissions") {
      return (
        <DatabaseView
          key="submissions"
          allFields={allFields}
          eventId={eventId}
          mode="submissions"
          onRefresh={refreshResults}
          responses={currentResponses}
          sections={sections}
          showToast={showToast}
          submitFormSettings={submitFormSettings}
          title="Submissions"
        />
      );
    }

    if (activeSection === "summary") {
      return (
        <div className="h-full overflow-y-auto bg-gray-50 p-6">
          <SummaryTab responses={currentResponses} allFields={allFields} />
        </div>
      );
    }

    if (activeSection === "analytics") {
      return (
        <AnalyticsTab
          allFields={allFields}
          analyticsEvents={analyticsEvents}
          onRefresh={refreshResults}
          sections={sections}
        />
      );
    }

    return (
      <DatabaseView
        key="inProgress"
        allFields={allFields}
        eventId={eventId}
        mode="inProgress"
        onRefresh={refreshResults}
        progressResponses={progressResponses}
        responses={[]}
        sections={sections}
        showToast={showToast}
        title="In progress"
      />
    );
  };

  return (
    <div className="flex h-full min-w-0 bg-white">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 px-2 py-2">
        <nav className="space-y-1">
          {RESULT_SECTIONS.map(({ icon: Icon, key, label }) => {
            const isActive = activeSection === key;
            const count =
              key === "submissions"
                ? currentResponses.length
                : key === "inProgress"
                  ? progressResponses.length
                  : null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-700 hover:bg-white hover:text-gray-950"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <Icon size={13} weight="fill" />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                {count !== null ? (
                  <span className="rounded-full bg-gray-200 px-1.5 text-xs font-semibold text-gray-700">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  );
}
