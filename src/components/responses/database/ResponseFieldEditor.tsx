import { useEffect, useRef, useState } from "react";
import { SelectionCheckIcon } from "@/components/icons";
import { useMutationUploadFile } from "@/api/upload";
import AddressField from "@/components/builder/section/AddressField";
import { BuilderMultiselectField } from "@/components/builder/section/BuilderMultiselectField";
import CheckboxField from "@/components/builder/section/CheckboxField";
import CurrencyField from "@/components/builder/section/CurrencyField";
import DatePickerField from "@/components/builder/section/DatePickerField";
import DropdownField from "@/components/builder/section/DropdownField";
import EmailField from "@/components/builder/section/EmailField";
import {
  FileUploadFieldCard,
  type FileUploadListItem,
} from "@/components/builder/section/FileUploadField";
import { LinearScaleField } from "@/components/builder/section/LinearScaleField";
import MultipleChoiceField from "@/components/builder/section/MultipleChoiceField";
import NumberField from "@/components/builder/section/NumberField";
import OpinionScaleField from "@/components/builder/section/OpinionScaleField";
import ParagraphField from "@/components/builder/section/ParagraphField";
import PhoneField from "@/components/builder/section/PhoneField";
import RankingField from "@/components/builder/section/RankingField";
import RatingField from "@/components/builder/section/RatingField";
import RichTextField from "@/components/builder/section/RichTextField";
import ShortTextField from "@/components/builder/section/ShortTextField";
import TimeField from "@/components/builder/section/TimeField";
import type { FormField } from "@/types/form";
import type { ResultsAnswerValue } from "@/types/results";
import {
  getAcceptedFileMimeList,
  isAllowedFileType,
} from "@/utils/form/fileTypes";
import { stripHtmlToText } from "@/utils/form/referenceTokens";
import { cleanResultLabel } from "../resultsResponseUtils";

type ResponseFieldEditorProps = {
  field: FormField;
  value: ResultsAnswerValue;
  onChange: (value: string | string[]) => void;
};

type AddressValue = {
  city?: string;
  state?: string;
  street?: string;
  zip?: string;
};

type RuntimeUploadItem = FileUploadListItem & {
  id: string;
  localPreviewUrl?: string;
  storageValue?: string;
};

function getStringValue(value: ResultsAnswerValue) {
  return Array.isArray(value) ? value.join(", ") : value ?? "";
}

function getListValue(value: ResultsAnswerValue) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function getFieldOptions(field: FormField, fallback: string[]) {
  return field.options?.length ? field.options : fallback;
}

function getPlaceholder(field: FormField, fallback: string) {
  const placeholder = stripHtmlToText(field.placeholder ?? "").trim();
  return placeholder || fallback;
}

function parseAddressValue(value: ResultsAnswerValue): AddressValue {
  if (Array.isArray(value)) {
    return {};
  }

  if (!value?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as AddressValue;
    }
  } catch {
    return { street: value };
  }

  return {};
}

function getRankingOptions(value: ResultsAnswerValue, field: FormField) {
  if (Array.isArray(value) && value.length > 0) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((entry) => typeof entry === "string")
      ) {
        return parsed;
      }
    } catch {
      return field.options ?? [];
    }
  }

  return getFieldOptions(field, ["Option 1", "Option 2", "Option 3"]);
}

function parseFileValue(value: string): { name: string; url: string } {
  const separatorIndex = value.indexOf("::");
  if (separatorIndex === -1) return { name: value, url: "" };

  return {
    name: value.slice(0, separatorIndex),
    url: value.slice(separatorIndex + 2),
  };
}

function getStoredFileValues(value: ResultsAnswerValue) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function isPreviewableFileName(name: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
}

function createStoredUploadItem(storedValue: string, index: number): RuntimeUploadItem {
  const { name, url } = parseFileValue(storedValue);
  const canPreview = isPreviewableFileName(name);

  return {
    id: `stored-${index}-${name}`,
    canPreview,
    name,
    previewUrl: canPreview ? url : undefined,
    progress: 100,
    status: "complete",
    storageValue: storedValue,
    url,
  };
}

function revokeUploadPreview(item: RuntimeUploadItem) {
  if (item.localPreviewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(item.localPreviewUrl);
  }
}

function getUploadProgressPercent(
  loaded: number,
  total: number | undefined,
  currentProgress: number,
) {
  if (typeof total === "number" && total > 0) {
    return Math.min(99, Math.max(2, Math.round((loaded / total) * 100)));
  }

  return Math.min(95, Math.max(2, currentProgress + 7));
}

function ResponseFileUploadEditor({
  field,
  onChange,
  value,
}: ResponseFieldEditorProps) {
  const [uploadError, setUploadError] = useState("");
  const [uploadItems, setUploadItems] = useState<RuntimeUploadItem[]>(() =>
    getStoredFileValues(value).map((file, index) => createStoredUploadItem(file, index)),
  );
  const uploadFile = useMutationUploadFile();
  const uploadControllersRef = useRef<Record<string, AbortController>>({});
  const uploadItemsRef = useRef<RuntimeUploadItem[]>(uploadItems);

  const maxCount = field.maxFileCount ?? 1;
  const maxSizeMb = field.maxFileSizeMb ?? 10;
  const canAddMore = uploadItems.length < maxCount;
  const acceptTypes = getAcceptedFileMimeList(field.allowedFileTypes);
  const isUploading = uploadItems.some((item) => item.status === "uploading");

  const syncAnswer = (items: RuntimeUploadItem[]) => {
    const completedFiles = items
      .filter((item) => item.status === "complete" && item.storageValue)
      .map((item) => item.storageValue as string);

    if (completedFiles.length === 0) {
      onChange("");
      return;
    }

    onChange(maxCount === 1 ? completedFiles[0] : completedFiles);
  };

  useEffect(() => {
    uploadItemsRef.current = uploadItems;
  }, [uploadItems]);

  useEffect(() => {
    const storedValues = getStoredFileValues(value);
    const storedValueKey = storedValues.join("\u0000");

    setUploadItems((current) => {
      const currentStoredKey = current
        .filter((item) => item.status === "complete" && item.storageValue)
        .map((item) => item.storageValue as string)
        .join("\u0000");

      if (storedValueKey === currentStoredKey) {
        return current;
      }

      const hasUploadingItems = current.some((item) => item.status === "uploading");
      if (!storedValues.length && hasUploadingItems) {
        return current;
      }

      current.forEach((item) => {
        if (item.status !== "uploading") {
          revokeUploadPreview(item);
        }
      });

      const preservedUploads = current.filter((item) => item.status === "uploading");
      const nextStoredItems = storedValues.map((file, index) =>
        createStoredUploadItem(file, index),
      );

      return preservedUploads.length > 0
        ? [...preservedUploads, ...nextStoredItems]
        : nextStoredItems;
    });
  }, [value]);

  useEffect(
    () => () => {
      Object.values(uploadControllersRef.current).forEach((controller) =>
        controller.abort(),
      );
      uploadItemsRef.current.forEach(revokeUploadPreview);
    },
    [],
  );

  const handleFiles = async (selectedFiles: FileList) => {
    setUploadError("");

    const remaining = maxCount - uploadItems.length;
    const filesToUpload = Array.from(selectedFiles).slice(0, remaining);

    for (const file of filesToUpload) {
      if (!isAllowedFileType(file, field.allowedFileTypes)) {
        setUploadError(`"${file.name}" - jenis file tidak diizinkan.`);
        return;
      }

      if ((field.limitFileSize ?? false) && file.size > maxSizeMb * 1024 * 1024) {
        setUploadError(`"${file.name}" - ukuran file melebihi ${maxSizeMb} MB.`);
        return;
      }
    }

    const newItems = filesToUpload.map((file, index) => {
      const canPreview = file.type.startsWith("image/") || isPreviewableFileName(file.name);
      const localPreviewUrl = canPreview ? URL.createObjectURL(file) : undefined;

      return {
        id: `${field.id}-${Date.now()}-${index}-${file.name}`,
        canPreview,
        localPreviewUrl,
        name: file.name,
        previewUrl: localPreviewUrl,
        progress: 2,
        status: "uploading" as const,
      };
    });

    setUploadItems((current) => [...current, ...newItems]);

    await Promise.all(
      newItems.map(async (item, itemIndex) => {
        const file = filesToUpload[itemIndex];
        const controller = new AbortController();
        uploadControllersRef.current[item.id] = controller;

        try {
          const result = await uploadFile.mutateAsync({
            file,
            onUploadProgress: (event) => {
              setUploadItems((current) =>
                current.map((entry) =>
                  entry.id === item.id
                    ? {
                        ...entry,
                        progress: getUploadProgressPercent(
                          event.loaded,
                          event.total,
                          entry.progress ?? 0,
                        ),
                      }
                    : entry,
                ),
              );
            },
            signal: controller.signal,
          });

          setUploadItems((current) => {
            const nextItems = current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    progress: 100,
                    status: "complete" as const,
                    storageValue: `${result.filename}::${result.url}`,
                    url: result.url,
                  }
                : entry,
            );

            syncAnswer(nextItems);
            return nextItems;
          });
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }

          console.error("[ResponseFileUploadEditor]:", error);
          setUploadError("Gagal mengupload file. Silakan coba lagi.");
          setUploadItems((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    errorMessage: "Upload gagal",
                    progress: entry.progress ?? 0,
                    status: "error" as const,
                  }
                : entry,
            ),
          );
        } finally {
          delete uploadControllersRef.current[item.id];
        }
      }),
    );
  };

  const removeFile = (index: number) => {
    const removedItem = uploadItems[index];
    if (!removedItem) return;

    uploadControllersRef.current[removedItem.id]?.abort();
    delete uploadControllersRef.current[removedItem.id];
    revokeUploadPreview(removedItem);

    const nextItems = uploadItems.filter((_, itemIndex) => itemIndex !== index);
    setUploadItems(nextItems);
    syncAnswer(nextItems);
  };

  return (
    <FileUploadFieldCard
      accept={acceptTypes}
      allowedFileTypes={field.allowedFileTypes}
      files={uploadItems}
      hideDropzone={!canAddMore}
      isUploading={isUploading}
      limitFileSize={field.limitFileSize}
      maxFileCount={field.maxFileCount}
      maxFileSizeMb={field.maxFileSizeMb}
      multiple={maxCount > 1}
      onFilesSelected={(nextFiles) => {
        void handleFiles(nextFiles);
      }}
      onRemoveFile={removeFile}
      showUploadLimits={field.showUploadLimits}
      uploadError={uploadError}
    />
  );
}

function SingleCheckboxResponseEditor({
  field,
  onChange,
  value,
}: ResponseFieldEditorProps) {
  const checked = getStringValue(value) === "true";

  return (
    <button
      type="button"
      onClick={() => onChange(checked ? "" : "true")}
      className="flex w-full select-none items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-gray-300"
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
          checked
            ? "theme-primary-border bg-primary-500"
            : "theme-answer-border border-gray-300"
        }`}
        style={
          checked
            ? {
                background: "var(--upform-theme-primary, #0054a5)",
                borderColor: "var(--upform-theme-primary, #0054a5)",
              }
            : undefined
        }
      >
        {checked ? <SelectionCheckIcon className="text-white" /> : null}
      </span>
      <span
        className={`text-sm leading-snug ${
          checked
            ? "theme-primary-text font-medium text-primary-700"
            : "theme-answer-text text-gray-600"
        }`}
      >
        {cleanResultLabel(field.label)}
      </span>
    </button>
  );
}

export default function ResponseFieldEditor({
  field,
  onChange,
  value,
}: ResponseFieldEditorProps) {
  const stringValue = getStringValue(value);
  const listValue = getListValue(value);

  if (field.type === "short_text") {
    return (
      <ShortTextField
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "Your answer")}
      />
    );
  }

  if (field.type === "long_text") {
    return (
      <ParagraphField
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "Long answer...")}
      />
    );
  }

  if (field.type === "rich_text") {
    return (
      <RichTextField
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "Write something here...")}
        showToolbar
      />
    );
  }

  if (field.type === "email") {
    return (
      <EmailField
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "email@example.com")}
      />
    );
  }

  if (field.type === "phone") {
    return (
      <PhoneField
        countryCode={field.countryCode ?? "US"}
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "Phone number")}
      />
    );
  }

  if (field.type === "number") {
    return (
      <NumberField
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "0")}
      />
    );
  }

  if (field.type === "currency") {
    return (
      <CurrencyField
        currencyCode={field.currencyCode}
        defaultValue={stringValue}
        onChange={onChange}
        placeholder={getPlaceholder(field, "0.00")}
      />
    );
  }

  if (field.type === "date") {
    return (
      <DatePickerField
        onChange={onChange}
        placeholder={getPlaceholder(field, "dd/mm/yyyy")}
        value={stringValue}
      />
    );
  }

  if (field.type === "time") {
    return <TimeField defaultValue={stringValue} onChange={onChange} />;
  }

  if (field.type === "multiple_choice") {
    const options = getFieldOptions(field, ["Option 1", "Option 2"]);

    return (
      <MultipleChoiceField
        defaultValue={stringValue}
        maxVisibleOptions={options.length}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        optionImages={field.optionImages}
        optionImageWidths={field.optionImageWidths}
        options={options}
        selectionMode="label"
        showOtherOption={field.hasOtherOption}
      />
    );
  }

  if (field.type === "checkbox") {
    const options = getFieldOptions(field, ["Option 1", "Option 2"]);

    return (
      <CheckboxField
        maxVisibleOptions={options.length}
        onChange={() => undefined}
        onRuntimeChange={onChange}
        optionImages={field.optionImages}
        optionImageWidths={field.optionImageWidths}
        options={options}
        selectedValues={listValue}
        showOtherOption={field.hasOtherOption}
      />
    );
  }

  if (field.type === "multiselect") {
    const options = getFieldOptions(field, ["Option 1", "Option 2"]);

    return (
      <BuilderMultiselectField
        onChange={() => undefined}
        onRuntimeChange={onChange}
        options={options}
        placeholder={getPlaceholder(field, "Select options")}
        selectedValues={listValue}
      />
    );
  }

  if (field.type === "dropdown") {
    return (
      <DropdownField
        defaultValue={stringValue}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={getFieldOptions(field, ["Option 1", "Option 2"])}
        placeholder={getPlaceholder(field, "Choose an option")}
        showClearButton
      />
    );
  }

  if (field.type === "opinion_scale") {
    return (
      <OpinionScaleField
        defaultValue={stringValue}
        max={field.scaleMax}
        maxLabel={field.maxLabel}
        min={field.scaleMin}
        minLabel={field.minLabel}
        onChange={(nextValue) => onChange(nextValue ?? "")}
      />
    );
  }

  if (field.type === "rating") {
    return (
      <RatingField
        allowHalfStar={field.allowHalfStar}
        defaultValue={stringValue}
        maxLabel={field.maxLabel}
        minLabel={field.minLabel}
        onChange={onChange}
        ratingIcon={field.ratingIcon}
        scaleMax={field.scaleMax}
      />
    );
  }

  if (field.type === "linear_scale") {
    return (
      <LinearScaleField
        defaultValue={stringValue}
        displayCurrentValue={field.displayCurrentValue}
        maxLabel={field.maxLabel}
        minLabel={field.minLabel}
        onChange={onChange}
        scaleMax={field.scaleMax}
        showValueAsPercentage={field.showValueAsPercentage}
      />
    );
  }

  if (field.type === "ranking") {
    return (
      <RankingField
        onChange={(nextItems) => onChange(JSON.stringify(nextItems))}
        options={getRankingOptions(value, field)}
      />
    );
  }

  if (field.type === "address") {
    const addressValue = parseAddressValue(value);

    return (
      <AddressField
        cityPlaceholder={field.addressSubPlaceholders?.city}
        cityValue={addressValue.city}
        onChange={(nextValue) => onChange(JSON.stringify(nextValue))}
        statePlaceholder={field.addressSubPlaceholders?.state}
        stateValue={addressValue.state}
        streetPlaceholder={field.addressSubPlaceholders?.street}
        streetValue={addressValue.street}
        zipPlaceholder={field.addressSubPlaceholders?.zip}
        zipValue={addressValue.zip}
      />
    );
  }

  if (field.type === "file_upload") {
    return <ResponseFileUploadEditor field={field} onChange={onChange} value={value} />;
  }

  if (field.type === "single_checkbox") {
    return (
      <SingleCheckboxResponseEditor
        field={field}
        onChange={onChange}
        value={value}
      />
    );
  }

  return (
    <ShortTextField
      defaultValue={stringValue}
      onChange={onChange}
      placeholder={getPlaceholder(field, "Your answer")}
    />
  );
}
