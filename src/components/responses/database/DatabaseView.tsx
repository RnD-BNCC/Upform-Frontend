import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowsOutSimpleIcon,
  CheckIcon,
  CheckSquareIcon,
  HashIcon,
} from "@phosphor-icons/react";
import {
  useMutationDeleteResponse,
  useMutationDeleteResponseProgress,
  useMutationSubmitResponse,
  useMutationUpdateResponse,
  useMutationUpdateResponseProgress,
} from "@/api/responses";
import { QUERY_KEYS } from "@/api/queryKeys";
import { FIELD_TYPE_META } from "@/components/builder/section/fieldTypeMeta";
import { ConfirmModal } from "@/components/modal";
import type { FormField, FormResponse, FormResponseProgress } from "@/types/form";
import type {
  ResultDatabaseView,
  ResultFilterGroup,
  ResultSortRule,
} from "@/types/results";
import type { ShareToast } from "@/types/builderShare";
import CreateViewModal from "./CreateViewModal";
import DatabaseToolbar from "./DatabaseToolbar";
import RecordActionMenu from "./RecordActionMenu";
import ResponseDrawer, { type ResponseSaveStatus } from "./ResponseDrawer";
import { exportExcelWorkbook } from "./excelExportUtils";
import {
  type AnalyticsDateFilter,
} from "../analytics/DateRangePopover";
import { isWithinAnalyticsDateFilter } from "../analytics/dateRangeUtils";
import {
  cleanResultLabel,
  getResponseTimestamp,
  toDatabaseProgressResponse,
  withSubmittedStatus,
} from "../resultsResponseUtils";
import {
  RESULT_VIEW_STORAGE_PREFIX,
  applySortRules,
  createDefaultView,
  createFieldColumns,
  createId,
  evaluateFilterGroup,
  formatAnswerValue,
  getDatabaseFields,
  getOrderedFields,
  normalizeViews,
  parseStoredViews,
  toStableResponseUuid,
} from "./resultsDatabaseUtils";

type DatabaseViewProps = {
  allFields: FormField[];
  eventId: string;
  mode?: "database" | "submissions" | "inProgress";
  onRefresh?: () => void | Promise<void>;
  progressResponses?: FormResponseProgress[];
  responses: FormResponse[];
  showToast?: ShareToast;
  title?: string;
};

type RecordActionMenuState = {
  deleteCount: number;
  left: number;
  responseId: string;
  top: number;
};

const SELECT_COL_WIDTH = 38;
const EXPAND_COL_WIDTH = 44;
const ID_COL_WIDTH = 198;
const EMAIL_COL_WIDTH = 220;
const DEFAULT_DATE_FILTER: AnalyticsDateFilter = { preset: "all" };

function getViewStorageKey(eventId: string, mode: NonNullable<DatabaseViewProps["mode"]>) {
  return `${RESULT_VIEW_STORAGE_PREFIX}${eventId}:${mode}`;
}

function getStoredViewState(
  eventId: string,
  fields: FormField[],
  mode: NonNullable<DatabaseViewProps["mode"]>,
) {
  const defaultView = createDefaultView(fields);

  if (typeof window === "undefined") {
    return { activeViewId: defaultView.id, views: [defaultView] };
  }

  const stored = parseStoredViews(
    window.localStorage.getItem(getViewStorageKey(eventId, mode)),
  );
  const views = normalizeViews(stored?.views ?? [defaultView], fields);
  const activeViewId =
    stored?.activeViewId && views.some((view) => view.id === stored.activeViewId)
      ? stored.activeViewId
      : views[0]?.id ?? defaultView.id;

  return { activeViewId, views };
}

function saveViewState(
  eventId: string,
  mode: NonNullable<DatabaseViewProps["mode"]>,
  activeViewId: string,
  views: ResultDatabaseView[],
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getViewStorageKey(eventId, mode),
    JSON.stringify({ activeViewId, views }),
  );
}

function getStickyStyle(left: number, width: number) {
  return {
    left,
    maxWidth: width,
    minWidth: width,
    width,
  };
}

function getClampedMenuPosition(left: number, top: number) {
  if (typeof window === "undefined") return { left, top };

  return {
    left: Math.min(Math.max(left, 8), window.innerWidth - 188),
    top: Math.min(Math.max(top, 8), window.innerHeight - 176),
  };
}

function createRespondentUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `respondent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function FieldHeader({ field }: { field: FormField }) {
  const meta = FIELD_TYPE_META[field.type];
  const Icon = meta?.Icon;
  return (
    <span className="flex min-w-0 items-center gap-2">
      {Icon ? (
        <Icon size={15} className="shrink-0 text-gray-500" />
      ) : (
        <CheckSquareIcon size={15} className="shrink-0 text-gray-500" />
      )}
      <span className="truncate">{cleanResultLabel(field.label)}</span>
    </span>
  );
}

function ResponseCell({
  field,
  response,
}: {
  field: FormField;
  response: FormResponse;
}) {
  const value = response.answers[field.id];
  const text = formatAnswerValue(value);

  if (!text) {
    return <span className="text-gray-300"> </span>;
  }

  return (
    <span className="block truncate text-gray-800" title={text}>
      {text}
    </span>
  );
}

export default function DatabaseView({
  allFields,
  eventId,
  mode = "database",
  onRefresh,
  progressResponses = [],
  responses,
  showToast,
  title = "My form database",
}: DatabaseViewProps) {
  const showViewSelector = mode === "database";
  const showListFilters = !showViewSelector;
  const databaseFields = useMemo(() => getDatabaseFields(allFields), [allFields]);
  const [viewState, setViewState] = useState(() =>
    getStoredViewState(eventId, databaseFields, mode),
  );
  const [draftAnswers, setDraftAnswers] = useState<
    Record<string, FormResponse["answers"]>
  >({});
  const [dateFilter, setDateFilter] =
    useState<AnalyticsDateFilter>(DEFAULT_DATE_FILTER);
  const [search, setSearch] = useState("");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [checkedRecordIds, setCheckedRecordIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [removedRecordIds, setRemovedRecordIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [drawerIndex, setDrawerIndex] = useState<number | null>(null);
  const [recordActionMenu, setRecordActionMenu] =
    useState<RecordActionMenuState | null>(null);
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[]>([]);
  const [createViewModalOpen, setCreateViewModalOpen] = useState(false);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, ResponseSaveStatus>>({});
  const saveTimers = useRef<Map<string, number>>(new Map());
  const queryClient = useQueryClient();
  const duplicateResponse = useMutationSubmitResponse(eventId, {
    onSuccess: () => {
      void refreshResponses();
    },
  });
  const deleteSubmittedResponse = useMutationDeleteResponse(eventId, {
    onSuccess: () => {
      void refreshResponses();
    },
  });
  const deleteProgressResponse = useMutationDeleteResponseProgress(eventId, {
    onSuccess: () => {
      void refreshResponses();
    },
  });
  const updateResponse = useMutationUpdateResponse(eventId);
  const updateProgress = useMutationUpdateResponseProgress(eventId);
  const allDatabaseResponses = useMemo(
    () =>
      [
        ...responses.map(withSubmittedStatus),
        ...progressResponses.map(toDatabaseProgressResponse),
      ].filter((response) => !removedRecordIds.has(response.id)),
    [progressResponses, removedRecordIds, responses],
  );

  const views = useMemo(
    () => normalizeViews(viewState.views, databaseFields),
    [databaseFields, viewState.views],
  );
  const activeView =
    views.find((view) => view.id === viewState.activeViewId) ?? views[0];
  const activeViewName = showViewSelector ? activeView.name : title;

  const responsesWithDrafts = useMemo(
    () =>
      allDatabaseResponses.map((response) => ({
        ...response,
        answers: draftAnswers[response.id] ?? response.answers,
      })),
    [allDatabaseResponses, draftAnswers],
  );

  const orderedFields = useMemo(
    () => getOrderedFields(databaseFields, activeView.fieldOrder),
    [activeView.fieldOrder, databaseFields],
  );
  const visibleFields = orderedFields.filter(
    (field) => !activeView.hiddenFieldIds.includes(field.id),
  );
  const columns = createFieldColumns(visibleFields);
  const stickyEmailFieldId =
    visibleFields.find((field) => field.type === "email")?.id ?? null;
  const emailStickyLeft = SELECT_COL_WIDTH + EXPAND_COL_WIDTH + ID_COL_WIDTH;

  const displayedResponses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filteredByListControls = responsesWithDrafts.filter((response) => {
      if (
        showListFilters &&
        !isWithinAnalyticsDateFilter(getResponseTimestamp(response), dateFilter)
      ) {
        return false;
      }

      if (!showListFilters || !query) return true;

      const searchableText = [
        toStableResponseUuid(response),
        response.status ?? "",
        getResponseTimestamp(response),
        ...Object.values(response.answers).map(formatAnswerValue),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    const filtered = filteredByListControls.filter((response) =>
      evaluateFilterGroup(response, activeView.filterGroup),
    );
    return applySortRules(filtered, activeView.sortRules);
  }, [
    activeView.filterGroup,
    activeView.sortRules,
    dateFilter,
    responsesWithDrafts,
    search,
    showListFilters,
  ]);

  const selectedResponse =
    drawerIndex === null ? null : displayedResponses[drawerIndex] ?? null;
  const actionMenuResponse = recordActionMenu
    ? displayedResponses.find((response) => response.id === recordActionMenu.responseId) ??
      null
    : null;
  const responseById = useMemo(
    () => new Map(displayedResponses.map((response) => [response.id, response])),
    [displayedResponses],
  );
  const allVisibleChecked =
    displayedResponses.length > 0 &&
    displayedResponses.every((response) => checkedRecordIds.has(response.id));
  const isPartiallyChecked =
    checkedRecordIds.size > 0 && !allVisibleChecked;

  useEffect(
    () => () => {
      saveTimers.current.forEach((timer) => window.clearTimeout(timer));
      saveTimers.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!recordActionMenu) return;

    const closeMenu = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-record-action-menu]")) return;
      if (target.closest("[data-record-select-control]")) return;
      setRecordActionMenu(null);
    };

    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [recordActionMenu]);

  useEffect(() => {
    const visibleIds = new Set(displayedResponses.map((response) => response.id));

    setCheckedRecordIds((previous) => {
      const next = new Set(
        Array.from(previous).filter((responseId) => visibleIds.has(responseId)),
      );
      return next.size === previous.size ? previous : next;
    });

    if (activeRecordId && !visibleIds.has(activeRecordId)) {
      setActiveRecordId(null);
    }

    if (recordActionMenu && !visibleIds.has(recordActionMenu.responseId)) {
      setRecordActionMenu(null);
    }

    if (drawerIndex !== null && !displayedResponses[drawerIndex]) {
      setDrawerIndex(null);
    }
  }, [activeRecordId, displayedResponses, drawerIndex, recordActionMenu]);

  const updateViews = (
    updater: (views: ResultDatabaseView[]) => ResultDatabaseView[],
    nextActiveId = viewState.activeViewId,
  ) => {
    setViewState((previous) => {
      const nextViews = updater(previous.views);
      const nextState = { activeViewId: nextActiveId, views: nextViews };
      saveViewState(eventId, mode, nextState.activeViewId, nextState.views);
      return nextState;
    });
  };

  const updateActiveView = (patch: Partial<ResultDatabaseView>) => {
    updateViews((currentViews) =>
      currentViews.map((view) =>
        view.id === activeView.id ? { ...view, ...patch } : view,
      ),
    );
  };

  const createView = (name: string) => {
    const nextView = {
      ...activeView,
      id: createId("view"),
      name,
    };
    updateViews((currentViews) => [...currentViews, nextView], nextView.id);
  };

  const renameView = (viewId: string, name: string) => {
    updateViews((currentViews) =>
      currentViews.map((view) => (view.id === viewId ? { ...view, name } : view)),
    );
  };

  const duplicateView = (viewId: string) => {
    const source = views.find((view) => view.id === viewId);
    if (!source) return;

    const nextView = {
      ...source,
      id: createId("view"),
      name: `${source.name} copy`,
    };
    updateViews((currentViews) => [...currentViews, nextView], nextView.id);
  };

  const deleteView = (viewId: string) => {
    if (views.length <= 1) return;
    const nextActiveId =
      activeView.id === viewId
        ? views.find((view) => view.id !== viewId)?.id ?? activeView.id
        : activeView.id;

    updateViews(
      (currentViews) => currentViews.filter((view) => view.id !== viewId),
      nextActiveId,
    );
  };

  const exportView = (viewId: string) => {
    const view = views.find((item) => item.id === viewId) ?? activeView;
    const fieldsForView = getOrderedFields(databaseFields, view.fieldOrder).filter(
      (field) => !view.hiddenFieldIds.includes(field.id),
    );
    const rows = applySortRules(
      responsesWithDrafts.filter((response) =>
        evaluateFilterGroup(response, view.filterGroup),
      ),
      view.sortRules,
    );
    const columns = [
      "ID",
      ...fieldsForView.map((field) => cleanResultLabel(field.label)),
    ];

    exportExcelWorkbook({
      columns,
      fileName: view.name || "responses",
      rows: rows.map((response) => [
        toStableResponseUuid(response),
        ...fieldsForView.map((field) =>
          formatAnswerValue(response.answers[field.id]),
        ),
      ]),
      sheetName: view.name || "Responses",
    });
  };

  const exportDisplayedList = () => {
    const columns = [
      "ID",
      ...visibleFields.map((field) => cleanResultLabel(field.label)),
    ];

    exportExcelWorkbook({
      columns,
      fileName: activeViewName || title || "responses",
      rows: displayedResponses.map((response) => [
        toStableResponseUuid(response),
        ...visibleFields.map((field) =>
          formatAnswerValue(response.answers[field.id]),
        ),
      ]),
      sheetName: activeViewName || "Responses",
    });
  };

  const refreshResponses = () => {
    if (onRefresh) {
      return Promise.resolve(onRefresh());
    }

    return Promise.all([
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.RESPONSES, eventId],
      }),
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.RESPONSE_PROGRESS, eventId],
      }),
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.EVENT_DETAIL, eventId],
      }),
    ]).then(() => undefined);
  };

  const selectView = (viewId: string) => {
    setViewState((previous) => {
      const nextState = { ...previous, activeViewId: viewId };
      saveViewState(eventId, mode, nextState.activeViewId, nextState.views);
      return nextState;
    });
  };

  const openRecordActionMenu = (
    responseId: string,
    left: number,
    top: number,
  ) => {
    const position = getClampedMenuPosition(left, top);
    const deleteCount =
      checkedRecordIds.size > 1 && checkedRecordIds.has(responseId)
        ? checkedRecordIds.size
        : 1;
    setActiveRecordId(responseId);
    setRecordActionMenu({ deleteCount, responseId, ...position });
  };

  const toggleRecordChecked = (
    response: FormResponse,
  ) => {
    setCheckedRecordIds((previous) => {
      const next = new Set(previous);
      if (next.has(response.id)) {
        next.delete(response.id);
      } else {
        next.add(response.id);
      }
      return next;
    });
    setActiveRecordId(response.id);
    setRecordActionMenu(null);
  };

  const toggleAllVisibleRecords = () => {
    setCheckedRecordIds((previous) => {
      if (allVisibleChecked) {
        return new Set();
      }

      const next = new Set(previous);
      displayedResponses.forEach((response) => next.add(response.id));
      return next;
    });
    setRecordActionMenu(null);
  };

  const expandRecord = (responseId: string) => {
    const nextIndex = displayedResponses.findIndex(
      (response) => response.id === responseId,
    );
    if (nextIndex >= 0) {
      setDrawerIndex(nextIndex);
      setActiveRecordId(responseId);
    }
    setRecordActionMenu(null);
  };

  const copyRecordId = (response: FormResponse) => {
    const recordId = toStableResponseUuid(response);
    if (!navigator.clipboard) {
      showToast?.("Clipboard is not available", "error");
      setRecordActionMenu(null);
      return;
    }

    navigator.clipboard
      .writeText(recordId)
      .then(() => showToast?.("Record ID copied"))
      .catch(() => showToast?.("Failed to copy record ID", "error"));
    setRecordActionMenu(null);
  };

  const duplicateRecord = (response: FormResponse) => {
    showToast?.("Duplicating record...", "info", 0);
    duplicateResponse.mutate({
      answers: { ...response.answers },
      deviceType: response.deviceType,
      respondentUuid: createRespondentUuid(),
      sectionHistory: response.sectionHistory,
      startedAt: new Date().toISOString(),
      userAgent: response.userAgent,
    }, {
      onError: () => showToast?.("Failed to duplicate record", "error"),
      onSuccess: () => showToast?.("Record duplicated"),
    });
    setRecordActionMenu(null);
  };

  const requestDeleteRecords = (response: FormResponse) => {
    const ids =
      recordActionMenu?.deleteCount && recordActionMenu.deleteCount > 1
        ? Array.from(checkedRecordIds)
        : [response.id];
    setDeleteConfirmIds(ids);
    setRecordActionMenu(null);
  };

  const confirmDeleteRecords = async () => {
    const recordsToDelete = deleteConfirmIds
      .map((responseId) => responseById.get(responseId))
      .filter(Boolean) as FormResponse[];

    if (recordsToDelete.length === 0) {
      setDeleteConfirmIds([]);
      return;
    }

    setDeleteConfirmIds([]);
    const deleteLabel =
      recordsToDelete.length === 1
        ? "Deleting record..."
        : `Deleting ${recordsToDelete.length} records...`;
    showToast?.(deleteLabel, "info", 0);

    try {
      await Promise.all(
        recordsToDelete.map((response) =>
          response.status === "in_progress"
            ? deleteProgressResponse.mutateAsync(response.id)
            : deleteSubmittedResponse.mutateAsync(response.id),
        ),
      );

      const deletedIds = new Set(recordsToDelete.map((response) => response.id));
      queryClient.setQueryData<FormResponse[]>(
        [QUERY_KEYS.RESPONSES, eventId],
        (current) => current?.filter((response) => !deletedIds.has(response.id)),
      );
      queryClient.setQueryData<FormResponseProgress[]>(
        [QUERY_KEYS.RESPONSE_PROGRESS, eventId],
        (current) => current?.filter((response) => !deletedIds.has(response.id)),
      );
      setRemovedRecordIds((previous) => {
        const next = new Set(previous);
        deletedIds.forEach((responseId) => next.add(responseId));
        return next;
      });
      setCheckedRecordIds((previous) => {
        const next = new Set(previous);
        recordsToDelete.forEach((response) => next.delete(response.id));
        return next;
      });
      setDraftAnswers((previous) => {
        const next = { ...previous };
        recordsToDelete.forEach((response) => {
          delete next[response.id];
        });
        return next;
      });
      setActiveRecordId((current) =>
        recordsToDelete.some((response) => response.id === current) ? null : current,
      );
      setDrawerIndex(null);
      showToast?.(
        recordsToDelete.length === 1
          ? "Record deleted"
          : `${recordsToDelete.length} records deleted`,
      );
    } catch {
      showToast?.(
        recordsToDelete.length === 1
          ? "Failed to delete record"
          : "Failed to delete records",
        "error",
      );
    }
  };

  const updateAnswer = (
    responseId: string,
    fieldId: string,
    value: string | string[],
  ) => {
    const source = displayedResponses.find((response) => response.id === responseId);
    if (!source) return;

    const nextAnswers = { ...source.answers, [fieldId]: value };
    setDraftAnswers((previous) => ({
      ...previous,
      [responseId]: nextAnswers,
    }));
    setSaveStatuses((previous) => ({ ...previous, [responseId]: "saving" }));

    const timerKey = `${responseId}:${fieldId}`;
    const existingTimer = saveTimers.current.get(timerKey);
    if (existingTimer) window.clearTimeout(existingTimer);

    const nextTimer = window.setTimeout(() => {
      const setSaved = () =>
        setSaveStatuses((previous) => ({ ...previous, [responseId]: "saved" }));
      const setError = () =>
        setSaveStatuses((previous) => ({ ...previous, [responseId]: "error" }));

      if (source.status === "in_progress") {
        updateProgress.mutate({
          progressId: responseId,
          payload: { answers: nextAnswers },
        }, {
          onError: setError,
          onSuccess: setSaved,
        });
      } else {
        updateResponse.mutate({
          responseId,
          payload: { answers: nextAnswers },
        }, {
          onError: setError,
          onSuccess: setSaved,
        });
      }
      saveTimers.current.delete(timerKey);
    }, 450);
    saveTimers.current.set(timerKey, nextTimer);
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{title}</span>
        </div>
      </div>

      <DatabaseToolbar
        activeView={activeView}
        dateFilter={dateFilter}
        fields={databaseFields}
        searchValue={search}
        showDateFilter={showListFilters}
        showSearch={showListFilters}
        showViewSelector={showViewSelector}
        views={views}
        onDateFilterChange={setDateFilter}
        onCreateView={() => setCreateViewModalOpen(true)}
        onDeleteView={deleteView}
        onDuplicateView={duplicateView}
        onExportList={showListFilters ? exportDisplayedList : undefined}
        onExportView={exportView}
        onFieldHiddenChange={(hiddenFieldIds) =>
          updateActiveView({ hiddenFieldIds })
        }
        onFieldOrderChange={(fieldOrder) => updateActiveView({ fieldOrder })}
        onFilterChange={(filterGroup: ResultFilterGroup) =>
          updateActiveView({ filterGroup })
        }
        onRefresh={refreshResponses}
        onRenameView={renameView}
        onSearchChange={setSearch}
        onSelectView={selectView}
        onSortChange={(sortRules: ResultSortRule[]) =>
          updateActiveView({ sortRules })
        }
      />

      {createViewModalOpen ? (
        <CreateViewModal
          isOpen
          onClose={() => setCreateViewModalOpen(false)}
          onCreate={createView}
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto bg-white">
        <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="h-10">
              <th
                className="sticky top-0 z-50 overflow-hidden border-b border-r border-gray-200 bg-white px-2 text-left"
                style={getStickyStyle(0, SELECT_COL_WIDTH)}
              >
                <button
                  type="button"
                  onClick={toggleAllVisibleRecords}
                  className="flex h-8 w-8 items-center justify-center rounded text-gray-500 hover:bg-gray-50"
                  aria-label="Select all visible records"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      allVisibleChecked
                        ? "border-gray-900 bg-gray-900 text-white"
                        : isPartiallyChecked
                          ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {allVisibleChecked ? (
                      <CheckIcon size={12} weight="bold" />
                    ) : isPartiallyChecked ? (
                      <span className="h-0.5 w-2.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                </button>
              </th>
              <th
                className="sticky top-0 z-50 overflow-hidden border-b border-r border-gray-200 bg-white"
                style={getStickyStyle(SELECT_COL_WIDTH, EXPAND_COL_WIDTH)}
              />
              <th
                className="sticky top-0 z-50 overflow-hidden border-b border-r border-gray-200 bg-white px-3 text-left font-medium text-gray-700"
                style={getStickyStyle(
                  SELECT_COL_WIDTH + EXPAND_COL_WIDTH,
                  ID_COL_WIDTH,
                )}
              >
                <span className="flex items-center gap-2">
                  <HashIcon size={15} className="text-gray-500" />
                  ID
                </span>
              </th>
              {columns.map((column) => {
                const field = visibleFields.find((item) => item.id === column.id);
                if (!field) return null;
                const isStickyEmail = column.id === stickyEmailFieldId;
                return (
                  <th
                    key={column.id}
                    className={`top-0 border-b border-r border-gray-200 bg-white px-3 text-left font-medium text-gray-700 ${
                      isStickyEmail
                        ? "sticky z-40 overflow-hidden"
                        : "sticky z-20"
                    }`}
                    style={
                      isStickyEmail
                        ? getStickyStyle(emailStickyLeft, EMAIL_COL_WIDTH)
                        : { minWidth: column.width, width: column.width }
                    }
                  >
                    <FieldHeader field={field} />
                  </th>
                );
              })}
              <th
                className="sticky top-0 z-20 border-b border-gray-200 bg-white"
                style={{ minWidth: 80, width: 80 }}
              />
            </tr>
          </thead>
          <tbody>
            {displayedResponses.map((response, index) => {
              const isDrawerActive = drawerIndex === index;
              const isRecordChecked = checkedRecordIds.has(response.id);
              const isRecordActive =
                activeRecordId === response.id || isRecordChecked || isDrawerActive;
              const stickyCellBackground = isRecordActive
                ? "bg-gray-50"
                : "bg-white group-hover:bg-gray-50";
              return (
                <tr
                  key={response.id}
                  className={`group h-10 transition-colors ${
                    isRecordActive ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveRecordId(response.id);
                    setRecordActionMenu(null);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openRecordActionMenu(response.id, event.clientX + 4, event.clientY + 4);
                  }}
                >
                  <td
                    className={`sticky z-40 overflow-hidden border-b border-r border-gray-200 px-2 ${stickyCellBackground}`}
                    style={getStickyStyle(0, SELECT_COL_WIDTH)}
                  >
                    <button
                      type="button"
                      data-record-select-control="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleRecordChecked(response);
                      }}
                      className="relative flex h-8 w-8 items-center justify-center rounded text-xs text-gray-500 hover:bg-white hover:text-gray-900"
                      aria-label={`Select record ${index + 1}`}
                      aria-pressed={isRecordChecked}
                    >
                      <span
                        className={`transition-opacity ${
                          isRecordChecked ? "opacity-0" : "group-hover:opacity-0"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`absolute flex h-5 w-5 items-center justify-center rounded border transition-opacity ${
                          isRecordChecked
                            ? "border-gray-900 bg-gray-900 text-white opacity-100"
                            : "border-gray-300 bg-white text-white opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {isRecordChecked ? (
                          <CheckIcon size={12} weight="bold" />
                        ) : null}
                      </span>
                    </button>
                  </td>
                  <td
                    className={`sticky z-40 overflow-hidden border-b border-r border-gray-200 ${stickyCellBackground}`}
                    style={getStickyStyle(SELECT_COL_WIDTH, EXPAND_COL_WIDTH)}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDrawerIndex(index);
                        setActiveRecordId(response.id);
                      }}
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded text-gray-500 transition-opacity hover:bg-white hover:text-gray-900 ${
                        isRecordActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="Open response"
                    >
                      <ArrowsOutSimpleIcon size={15} />
                    </button>
                  </td>
                  <td
                    className={`sticky z-40 overflow-hidden border-b border-r border-gray-200 px-3 text-gray-800 ${stickyCellBackground}`}
                    style={getStickyStyle(
                      SELECT_COL_WIDTH + EXPAND_COL_WIDTH,
                      ID_COL_WIDTH,
                    )}
                    title={toStableResponseUuid(response)}
                  >
                    <span className="block truncate">
                      {toStableResponseUuid(response)}
                    </span>
                  </td>

                  {columns.map((column) => {
                    const field = visibleFields.find((item) => item.id === column.id);
                    if (!field) return null;
                    const isStickyEmail = column.id === stickyEmailFieldId;
                    return (
                      <td
                        key={column.id}
                        className={`border-b border-r border-gray-200 bg-inherit px-3 ${
                          isStickyEmail
                            ? `sticky z-30 overflow-hidden ${stickyCellBackground}`
                            : ""
                        }`}
                        style={
                          isStickyEmail
                            ? getStickyStyle(emailStickyLeft, EMAIL_COL_WIDTH)
                            : { minWidth: column.width, width: column.width }
                        }
                      >
                        <ResponseCell field={field} response={response} />
                      </td>
                    );
                  })}
                  <td
                    className="border-b border-gray-200 bg-inherit"
                    style={{ minWidth: 80, width: 80 }}
                  />
                </tr>
              );
            })}

            {Array.from({ length: Math.max(6 - displayedResponses.length, 0) }).map(
              (_, index) => (
                <tr key={`empty-${index}`} className="h-10">
                  <td
                    className="sticky z-40 overflow-hidden border-b border-r border-gray-200 bg-white"
                    style={getStickyStyle(0, SELECT_COL_WIDTH)}
                  />
                  <td
                    className="sticky z-40 overflow-hidden border-b border-r border-gray-200 bg-white"
                    style={getStickyStyle(SELECT_COL_WIDTH, EXPAND_COL_WIDTH)}
                  />
                  <td
                    className="sticky z-40 overflow-hidden border-b border-r border-gray-200 bg-white"
                    style={getStickyStyle(
                      SELECT_COL_WIDTH + EXPAND_COL_WIDTH,
                      ID_COL_WIDTH,
                    )}
                  />
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="border-b border-r border-gray-200 bg-white"
                      style={{
                        minWidth:
                          column.id === stickyEmailFieldId
                            ? EMAIL_COL_WIDTH
                            : column.width,
                        width:
                          column.id === stickyEmailFieldId
                            ? EMAIL_COL_WIDTH
                            : column.width,
                      }}
                    />
                  ))}
                  <td
                    className="border-b border-gray-200 bg-white"
                    style={{ minWidth: 80, width: 80 }}
                  />
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {recordActionMenu && actionMenuResponse ? (
        <RecordActionMenu
          isBusy={
            duplicateResponse.isPending ||
            deleteSubmittedResponse.isPending ||
            deleteProgressResponse.isPending
          }
          deleteCount={recordActionMenu.deleteCount}
          left={recordActionMenu.left}
          top={recordActionMenu.top}
          onCopyRecordId={() => copyRecordId(actionMenuResponse)}
          onDeleteRecord={() => requestDeleteRecords(actionMenuResponse)}
          onDuplicateRecord={() => duplicateRecord(actionMenuResponse)}
          onExpandRecord={() => expandRecord(actionMenuResponse.id)}
        />
      ) : null}

      <ConfirmModal
        isOpen={deleteConfirmIds.length > 0}
        title={
          deleteConfirmIds.length === 1
            ? "Delete record?"
            : `Delete ${deleteConfirmIds.length} records?`
        }
        description={
          deleteConfirmIds.length === 1
            ? "Are you sure? This record will be permanently removed."
            : "Are you sure? These records will be permanently removed."
        }
        confirmText={
          deleteConfirmIds.length === 1
            ? "Delete record"
            : `Delete ${deleteConfirmIds.length} records`
        }
        cancelText="Cancel"
        variant="danger"
        onClose={() => setDeleteConfirmIds([])}
        onConfirm={() => {
          void confirmDeleteRecords();
        }}
      />

      {selectedResponse ? (
        <ResponseDrawer
          fields={visibleFields}
          index={drawerIndex ?? 0}
          response={selectedResponse}
          saveStatus={saveStatuses[selectedResponse.id] ?? "saved"}
          total={displayedResponses.length}
          viewName={activeViewName}
          onClose={() => setDrawerIndex(null)}
          onMove={setDrawerIndex}
          onUpdateAnswer={updateAnswer}
        />
      ) : null}
    </div>
  );
}
