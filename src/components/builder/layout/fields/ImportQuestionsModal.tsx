import { useMemo, useState } from "react";
import {
  CheckSquareIcon,
  FilePlusIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SquareIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useGetEventQuestions, useGetEvents } from "@/hooks/events";
import { BaseModal, Spinner } from "@/components/ui";
import { FieldPreviewCard } from "@/components/builder/preview/shared/FieldPreviewCard";
import type { FormEvent, FormField, FormSection } from "@/types/form";
import { stripHtmlToText } from "@/utils/form/referenceTokens";
import { getFieldPlugin } from "@/components/builder/section/fieldRegistry";

type Props = {
  currentEventId?: string;
  isOpen: boolean;
  onClose: () => void;
  onImport: (fields: FormField[]) => void;
};

function getFormTitle(form: Pick<FormEvent, "name">) {
  return form.name?.trim() || "Untitled Form";
}

function getFieldLabel(field: FormField) {
  return stripHtmlToText(field.label) || "Untitled question";
}

function getFieldTypeLabel(field: FormField) {
  return getFieldPlugin(field.type)?.meta.label ?? field.type.replaceAll("_", " ");
}

function getImportableSectionFields(section: FormSection) {
  return section.fields.filter((field) => field.type !== "next_button");
}

function formatList(values?: string[]) {
  const cleanValues = (values ?? [])
    .map((value) => stripHtmlToText(value))
    .filter(Boolean);
  if (cleanValues.length === 0) return "";
  return cleanValues.join(", ");
}

function formatBoolean(value: boolean | undefined, yes: string, no = "") {
  if (value === undefined) return "";
  return value ? yes : no;
}

function getFieldPreviewRows(field: FormField) {
  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Required",
      value: field.required ? "Yes" : "No",
    },
  ];

  const description = stripHtmlToText(field.description);
  if (description) rows.push({ label: "Description", value: description });
  if (field.placeholder) rows.push({ label: "Placeholder", value: field.placeholder });
  if (field.defaultValue) {
    rows.push({ label: "Default value", value: field.defaultValue });
  }

  const options = formatList(field.options);
  if (options) rows.push({ label: "Options", value: options });

  if (field.scaleMin !== undefined || field.scaleMax !== undefined) {
    rows.push({
      label: "Scale range",
      value: `${field.scaleMin ?? 1} to ${field.scaleMax ?? 5}`,
    });
  }

  if (field.minLabel || field.maxLabel) {
    rows.push({
      label: "Scale labels",
      value: [field.minLabel, field.maxLabel].filter(Boolean).join(" - "),
    });
  }

  const validationRules = [
    field.validationMinLength !== undefined
      ? `Min length ${field.validationMinLength}`
      : "",
    field.validationMaxLength !== undefined
      ? `Max length ${field.validationMaxLength}`
      : "",
    field.validationPattern && field.validationPattern !== "none"
      ? `Pattern ${field.validationPattern}`
      : "",
    field.validationEmailDomain ? `Domain ${field.validationEmailDomain}` : "",
    field.validationMinSelection !== undefined
      ? `Min selection ${field.validationMinSelection}`
      : "",
    field.validationMaxSelection !== undefined
      ? `Max selection ${field.validationMaxSelection}`
      : "",
  ].filter(Boolean);
  if (validationRules.length > 0) {
    rows.push({ label: "Validation", value: validationRules.join(", ") });
  }

  if (field.type === "file_upload") {
    const uploadRules = [
      field.maxFileCount ? `${field.maxFileCount} file max` : "",
      field.minFileCount ? `${field.minFileCount} file min` : "",
      field.limitFileSize ? `${field.maxFileSizeMb ?? 10}MB max` : "",
      field.allowedFileTypes?.length
        ? `${field.allowedFileTypes.join(", ")} only`
        : "",
    ].filter(Boolean);
    if (uploadRules.length > 0) {
      rows.push({ label: "Upload limits", value: uploadRules.join(", ") });
    }
  }

  const displayRules = [
    formatBoolean(field.shuffleOptions, "Shuffle options"),
    formatBoolean(field.hasOtherOption, "Has other option"),
    formatBoolean(field.hideAlways, "Hidden from respondents"),
    field.fieldWidth === "half" ? "Half-width layout" : "",
  ].filter(Boolean);
  if (displayRules.length > 0) {
    rows.push({ label: "Display", value: displayRules.join(", ") });
  }

  if (field.correctAnswer) {
    rows.push({
      label: "Answer key",
      value: Array.isArray(field.correctAnswer)
        ? field.correctAnswer.join(", ")
        : field.correctAnswer,
    });
  }

  if (field.buttonUrl) rows.push({ label: "Button URL", value: field.buttonUrl });
  if (field.currencyCode) rows.push({ label: "Currency", value: field.currencyCode });
  if (field.countryCode) rows.push({ label: "Country", value: field.countryCode });
  if (field.imageCaption) {
    rows.push({ label: "Image caption", value: field.imageCaption });
  }

  return rows;
}

function ImportQuestionTypeIcon({ field }: { field: FormField }) {
  const meta = getFieldPlugin(field.type)?.meta;
  const Icon = meta?.Icon ?? FileTextIcon;

  return (
    <span
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
        meta?.iconBg ?? "bg-gray-100 text-gray-500"
      }`}
      title={getFieldTypeLabel(field)}
    >
      <Icon size={16} />
    </span>
  );
}

function ImportQuestionPreview({
  field,
  sectionTitle,
  selected,
}: {
  field?: FormField;
  sectionTitle?: string;
  selected: boolean;
}) {
  if (!field) {
    return (
      <aside className="hidden min-h-0 border-l border-gray-100 bg-gray-50/70 p-4 lg:block">
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-white px-4 text-center">
          <div>
            <FileTextIcon size={28} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-bold text-gray-600">
              No question selected
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              Choose a question to inspect its fields before importing.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const rows = getFieldPreviewRows(field);

  return (
    <aside className="hidden min-h-0 flex-col border-l border-gray-100 bg-gray-50/70 lg:flex">
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">
          Preview
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-black text-gray-900">
          {getFieldLabel(field)}
        </p>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <ImportQuestionTypeIcon field={field} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black capitalize text-gray-900">
                {getFieldTypeLabel(field)}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold text-gray-400">
                {sectionTitle ?? "Question"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                selected
                  ? "bg-primary-50 text-primary-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {selected ? "Selected" : "Preview"}
            </span>
          </div>

          <div className="mt-4">
            <FieldPreviewCard field={field} label="Respondent preview" />
          </div>

          <div className="mt-4 space-y-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="rounded-md border border-gray-100 px-3 py-2"
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                  {row.label}
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-700">
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {(field.conditionTree || field.conditions?.length) ? (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-700">
              <ShieldCheckIcon size={15} weight="bold" className="mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">
                This question includes conditional visibility logic.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export default function ImportQuestionsModal({
  currentEventId,
  isOpen,
  onClose,
  onImport,
}: Props) {
  const [search, setSearch] = useState("");
  const [preferredEventId, setPreferredEventId] = useState<string>("");
  const [selection, setSelection] = useState<{
    eventId: string;
    fieldIds: Set<string>;
  }>(() => ({ eventId: "", fieldIds: new Set() }));
  const [activePreviewFieldId, setActivePreviewFieldId] = useState("");
  const { data: formsResult, isLoading: isFormsLoading } = useGetEvents({
    page: 1,
    take: 100,
    search: search.trim() || undefined,
  });
  const forms = useMemo(
    () =>
      (formsResult?.data ?? []).filter((form) => form.id !== currentEventId),
    [currentEventId, formsResult?.data],
  );
  const selectedEventId = forms.some((form) => form.id === preferredEventId)
    ? preferredEventId
    : forms[0]?.id ?? "";
  const selectedFieldIds = useMemo(
    () =>
      selection.eventId === selectedEventId
        ? selection.fieldIds
        : new Set<string>(),
    [selectedEventId, selection.eventId, selection.fieldIds],
  );
  const { data: selectedEvent, isLoading: isDetailLoading } =
    useGetEventQuestions(selectedEventId);
  const importableGroups = useMemo(
    () =>
      (selectedEvent?.sections ?? [])
        .slice()
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        .map((section, index) => ({
          fields: getImportableSectionFields(section),
          id: section.id,
          title: section.title?.trim() || `Page ${index + 1}`,
        }))
        .filter((group) => group.fields.length > 0),
    [selectedEvent?.sections],
  );
  const importableFields = useMemo(
    () => importableGroups.flatMap((group) => group.fields),
    [importableGroups],
  );
  const selectedFields = useMemo(
    () => importableFields.filter((field) => selectedFieldIds.has(field.id)),
    [importableFields, selectedFieldIds],
  );
  const previewField =
    importableFields.find((field) => field.id === activePreviewFieldId) ??
    selectedFields[0] ??
    importableFields[0];
  const previewSectionTitle = previewField
    ? importableGroups.find((group) =>
        group.fields.some((field) => field.id === previewField.id),
      )?.title
    : undefined;
  const allSelected =
    importableFields.length > 0 &&
    selectedFields.length === importableFields.length;

  const toggleField = (fieldId: string) => {
    setActivePreviewFieldId(fieldId);
    setSelection((current) => {
      const next = new Set(
        current.eventId === selectedEventId ? current.fieldIds : [],
      );
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return { eventId: selectedEventId, fieldIds: next };
    });
  };

  const toggleAll = () => {
    if (!allSelected && importableFields[0]) {
      setActivePreviewFieldId(importableFields[0].id);
    }
    setSelection({
      eventId: selectedEventId,
      fieldIds: allSelected
        ? new Set()
        : new Set(importableFields.map((field) => field.id)),
    });
  };

  const handleImport = () => {
    if (selectedFields.length === 0) return;
    onImport(selectedFields);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex="z-[9999]"
      className="w-[min(1180px,calc(100vw-2rem))]"
    >
      <div className="flex h-[620px] max-h-[calc(100vh-3rem)] flex-col overflow-hidden">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-50 text-primary-600">
              <FilePlusIcon size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Import questions
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Pick questions from another form and add them to this page.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <aside className="flex min-h-0 flex-col border-r border-gray-100 bg-gray-50">
            <div className="p-3">
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2">
                <MagnifyingGlassIcon size={14} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search forms"
                  className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {isFormsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
                  <Spinner size={16} className="text-primary-500" />
                  Loading forms...
                </div>
              ) : forms.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-gray-400">
                  No other forms found.
                </div>
              ) : (
                <div className="space-y-1">
                  {forms.map((form) => {
                    const selected = form.id === selectedEventId;
                    return (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => {
                          setPreferredEventId(form.id);
                          setActivePreviewFieldId("");
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${
                          selected
                            ? "bg-white text-primary-700 shadow-sm ring-1 ring-primary-100"
                            : "text-gray-600 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        <FileTextIcon
                          size={15}
                          className={selected ? "text-primary-500" : "text-gray-400"}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">
                            {getFormTitle(form)}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-gray-400">
                            {form.responseCount ?? 0} responses
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {selectedEvent ? getFormTitle(selectedEvent) : "Questions"}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {selectedFields.length} selected
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                disabled={importableFields.length === 0}
                className="rounded-sm border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
              {isDetailLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-xs text-gray-400">
                  <Spinner size={18} className="text-primary-500" />
                  Loading questions...
                </div>
              ) : importableGroups.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <FileTextIcon size={28} className="mx-auto text-gray-300" />
                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      No importable questions
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Choose another form or add questions there first.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {importableGroups.map((group) => (
                    <div key={group.id}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {group.title}
                      </p>
                      <div className="space-y-2">
                        {group.fields.map((field) => {
                          const selected = selectedFieldIds.has(field.id);
                          const Icon = selected ? CheckSquareIcon : SquareIcon;
                          return (
                            <button
                              key={field.id}
                              type="button"
                              onMouseEnter={() => setActivePreviewFieldId(field.id)}
                              onFocus={() => setActivePreviewFieldId(field.id)}
                              onClick={() => toggleField(field.id)}
                              className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                                selected
                                  ? "border-primary-200 bg-primary-50/70"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <Icon
                                size={17}
                                weight={selected ? "fill" : "regular"}
                                className={
                                  selected ? "mt-0.5 text-primary-600" : "mt-0.5 text-gray-300"
                                }
                              />
                              <ImportQuestionTypeIcon field={field} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-gray-800">
                                  {getFieldLabel(field)}
                                </span>
                                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs capitalize text-gray-400">
                                  <span>{getFieldTypeLabel(field)}</span>
                                  {field.required ? (
                                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-500">
                                      Required
                                    </span>
                                  ) : null}
                                  {field.options?.length ? (
                                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                                      {field.options.length} options
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <ImportQuestionPreview
            field={previewField}
            sectionTitle={previewSectionTitle}
            selected={previewField ? selectedFieldIds.has(previewField.id) : false}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={selectedFields.length === 0}
            className="rounded-sm bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Import selected
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
