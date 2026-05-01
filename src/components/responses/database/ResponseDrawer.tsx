import { useMemo } from "react";
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/ui";
import type { FormField, FormResponse } from "@/types/form";
import { cleanResultLabel, getResponseTimestamp } from "../resultsResponseUtils";
import { formatAnswerValue, toStableResponseUuid } from "./resultsDatabaseUtils";
import ResponseFieldEditor from "./ResponseFieldEditor";

type ResponseDrawerProps = {
  fields: FormField[];
  index: number;
  response: FormResponse;
  saveStatus: ResponseSaveStatus;
  total: number;
  viewName: string;
  onClose: () => void;
  onMove: (nextIndex: number) => void;
  onUpdateAnswer: (responseId: string, fieldId: string, value: string | string[]) => void;
};

export type ResponseSaveStatus = "error" | "saved" | "saving";

function SaveStatusLabel({ status }: { status: ResponseSaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500">
        <Spinner size={15} className="text-gray-400" />
        Saving...
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-red-500">
        <WarningCircleIcon size={15} weight="fill" />
        Not saved
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500">
      <CheckCircleIcon size={15} className="text-gray-400" />
      Saved
    </span>
  );
}

export default function ResponseDrawer({
  fields,
  index,
  onClose,
  onMove,
  onUpdateAnswer,
  response,
  saveStatus,
  total,
  viewName,
}: ResponseDrawerProps) {
  const uuid = useMemo(() => toStableResponseUuid(response), [response]);
  const isInProgress = response.status === "in_progress";

  return (
    <div className="fixed inset-0 z-60 bg-black/25" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-l-md border-l border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
          <button
            type="button"
            onClick={() => onMove(Math.max(0, index - 1))}
            disabled={index === 0}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous response"
          >
            <CaretUpIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(Math.min(total - 1, index + 1))}
            disabled={index === total - 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next response"
          >
            <CaretDownIcon size={15} />
          </button>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-500">
            {index + 1} of {total} in{" "}
            <span className="font-semibold text-gray-800">{viewName}</span>
          </span>
          <SaveStatusLabel status={saveStatus} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
            aria-label="Close response detail"
          >
            <XIcon size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-600">
                ID
              </label>
              <input
                value={uuid}
                disabled
                className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm outline-none"
              />
            </div>

            {fields.map((field) => (
              <div key={field.id}>
                {field.type !== "single_checkbox" ? (
                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    {cleanResultLabel(field.label)}
                  </label>
                ) : null}
                <ResponseFieldEditor
                  field={field}
                  value={response.answers[field.id]}
                  onChange={(value) => onUpdateAnswer(response.id, field.id, value)}
                />
              </div>
            ))}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-600">
                {isInProgress ? "Last saved at" : "Submitted at"}
              </label>
              <input
                value={formatAnswerValue(getResponseTimestamp(response))}
                disabled
                className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm outline-none"
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
