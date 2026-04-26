import { useState } from "react";
import {
  CaretDownIcon,
  CaretUpIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Toggle } from "@/components/ui";
import type { ConditionGroup, FormField, FormSection } from "@/types/form";
import {
  ConditionalLogicIcon,
  PointerSelectIcon,
} from "@/components/icons";
import {
  CONDITION_FIELD_TYPE_LABELS,
  getAvailableConditionFieldsForField,
} from "@/utils/form";
import { ConditionPopup } from "../reference/FieldConditionEditor";
import { countConditionNodes } from "../reference/fieldConditionUtils";
import ReferenceTextEditor from "../reference/ReferenceTextEditor";
import RichInput from "../../utils/RichInput";
import {
  getAvailableReferenceFieldGroupsForField,
  stripHtmlToText,
} from "@/utils/form/referenceTokens";
import {
  fieldSupportsSetting,
  getFieldPlugin,
} from "@/components/builder/section/fieldRegistry";
import {
  formatCurrencyInput,
  normalizeCurrencyInput,
} from "@/components/builder/section/CurrencyField";
import HelpTooltip from "../shared/HelpTooltip";

type Props = {
  isOpen: boolean;
  field?: FormField;
  sections?: FormSection[];
  onChange: (updates: Partial<FormField>) => void;
  onClose: () => void;
};


function Section({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-100">
      <button
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-xs font-semibold uppercase leading-none tracking-wider text-gray-700">
          {label}
        </span>
        {open ? (
          <CaretUpIcon size={12} className="shrink-0 text-gray-400" />
        ) : (
          <CaretDownIcon size={12} className="shrink-0 text-gray-400" />
        )}
      </button>
      {open ? <div className="space-y-3 px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function Label({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <span className="text-xs font-medium text-gray-600">{children}</span>
      {tooltip ? (
        <HelpTooltip>{tooltip}</HelpTooltip>
      ) : null}
    </div>
  );
}

const HAS_OPTIONS = [
  "multiple_choice",
  "checkbox",
  "multiselect",
  "dropdown",
  "ranking",
];

const HAS_VALIDATION = [
  "short_text",
  "long_text",
  "paragraph",
  "email",
  "phone",
  "address",
  "number",
  "currency",
  "rich_text",
  "single_checkbox",
];

const HAS_SELECTION_VALIDATION = [
  "multiple_choice",
  "checkbox",
  "multiselect",
];

const VALIDATION_PATTERNS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number only" },
];

function normalizeReferenceEditorValue(value: string) {
  return stripHtmlToText(value) ? value : undefined;
}

const MULTILINE_DEFAULT_VALUE_FIELDS = ["long_text", "paragraph"] as const;

export default function FieldPropertiesPanel({
  isOpen,
  field,
  sections = [],
  onChange,
  onClose,
}: Props) {
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [conditionOpenFieldId, setConditionOpenFieldId] = useState<
    string | null
  >(null);
  const [conditionAnchorEl, setConditionAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  if (!isOpen) return null;

  if (!field) {
    return (
      <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-gray-50">
        <div className="flex items-center justify-end px-4 py-3">
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon size={14} weight="bold" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <PointerSelectIcon className="text-gray-300" />
          <p className="text-xs leading-relaxed text-gray-400">
            Click a field in your form to modify it
          </p>
        </div>
      </div>
    );
  }

  const hasOptions = HAS_OPTIONS.includes(field.type);
  const hasCaption = fieldSupportsSetting(field.type, "caption");
  const hasPlaceholder = fieldSupportsSetting(field.type, "placeholder");
  const hasValidation = HAS_VALIDATION.includes(field.type);
  const hasDefaultValue = fieldSupportsSetting(field.type, "defaultValue");
  const hasMultilineDefaultValue = MULTILINE_DEFAULT_VALUE_FIELDS.includes(
    field.type as (typeof MULTILINE_DEFAULT_VALUE_FIELDS)[number],
  );
  const isDisplayOnly = fieldSupportsSetting(field.type, "displayOnly");
  const supportsHalfWidth = fieldSupportsSetting(field.type, "halfWidth");
  const supportsLogic = fieldSupportsSetting(field.type, "logic");
  const activeFieldPlugin = getFieldPlugin(field.type);
  const options = field.options ?? [];

  const updateOption = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    onChange({ options: next });
  };

  const removeOption = (idx: number) => {
    onChange({ options: options.filter((_, index) => index !== idx) });
  };

  const addOption = () => {
    onChange({ options: [...options, `Option ${options.length + 1}`] });
  };

  const applyBulk = () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      onChange({ options: [...options, ...lines] });
    }

    setBulkText("");
    setShowBulk(false);
  };

  const availableFields = getAvailableConditionFieldsForField(
    sections,
    field.id,
  );
  const availableFieldGroups = getAvailableReferenceFieldGroupsForField(
    sections,
    field.id,
  );

  const legacyPluginSettings = activeFieldPlugin?.renderSettings?.({
    availableFieldGroups,
    availableFields,
    field,
    onChange,
  });

  const pluginSettingsSections =
    activeFieldPlugin?.renderSettingsSections?.({
      availableFieldGroups,
      availableFields,
      field,
      onChange,
    }) ?? (legacyPluginSettings != null ? { basic: legacyPluginSettings } : {});

  const pluginBasicSettings = pluginSettingsSections.basic;
  const pluginOptionsSettings = pluginSettingsSections.options;
  const pluginValidationSettings = pluginSettingsSections.validation;
  const pluginFileSizeSettings = pluginSettingsSections.fileSize;
  const pluginAdvancedSettings = pluginSettingsSections.advanced;
  const showPluginOptionsSettings = pluginOptionsSettings != null;
  const showPluginValidationSettings = pluginValidationSettings != null;

  const conditionTree: ConditionGroup = field.conditionTree ?? {
    type: "group",
    logic: "and",
    items: [],
  };
  const hasConditions = conditionTree.items.length > 0;
  const conditionOpen = conditionOpenFieldId === field.id;

  const updateConditionTree = (tree: ConditionGroup) => {
    onChange({ conditionTree: tree.items.length > 0 ? tree : undefined });
  };

  const showDefaultValidationSection =
    !isDisplayOnly &&
    !HAS_VALIDATION.includes(field.type) &&
    !HAS_SELECTION_VALIDATION.includes(field.type) &&
    field.type !== "file_upload";

  const showValidationSection =
    HAS_SELECTION_VALIDATION.includes(field.type) ||
    hasValidation ||
    showDefaultValidationSection ||
    showPluginValidationSettings;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-gray-50">
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {CONDITION_FIELD_TYPE_LABELS[field.type] ?? "Field"}
          </span>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon size={14} weight="bold" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section label="Basic">
          {hasCaption ? (
            <div>
              <Label tooltip="Shown below the field title">Caption</Label>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <RichInput
                  referenceFields={availableFields}
                  referenceFieldGroups={availableFieldGroups}
                  value={field.description ?? ""}
                  onChange={(nextValue) =>
                    onChange({
                      description: normalizeReferenceEditorValue(nextValue),
                    })
                  }
                  placeholder="Add caption..."
                  placeholderClassName="px-3 py-2 text-xs text-gray-400"
                  className="min-h-20 px-3 py-2 text-xs text-gray-700"
                  staticToolbar
                  stopPropagation
                />
              </div>
            </div>
          ) : null}

          {hasPlaceholder ? (
            <div>
              <Label>Placeholder</Label>
              <ReferenceTextEditor
                availableFields={availableFields}
                availableFieldGroups={availableFieldGroups}
                value={field.placeholder ?? ""}
                onChange={(nextValue) =>
                  onChange({
                    placeholder: normalizeReferenceEditorValue(nextValue),
                  })
                }
                placeholder="Enter placeholder..."
              />
            </div>
          ) : null}

          {hasDefaultValue ? (
            <div>
              <Label>Default value</Label>
              {field.type === "rich_text" ? (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <RichInput
                    referenceFields={availableFields}
                    referenceFieldGroups={availableFieldGroups}
                    value={field.defaultValue ?? ""}
                    onChange={(nextValue) =>
                      onChange({
                        defaultValue: normalizeReferenceEditorValue(nextValue),
                      })
                    }
                    placeholder="Pre-filled value..."
                    placeholderClassName="px-3 py-2 text-xs text-gray-400"
                    className="min-h-20 px-3 py-2 text-xs text-gray-700"
                    staticToolbar
                    stopPropagation
                  />
                </div>
              ) : field.type === "currency" ? (
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatCurrencyInput(field.defaultValue)}
                  onChange={(event) => {
                    const nextValue = normalizeCurrencyInput(event.target.value);
                    onChange({ defaultValue: nextValue || undefined });
                  }}
                  placeholder="Pre-filled value..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                />
              ) : (
                <ReferenceTextEditor
                  availableFields={availableFields}
                  availableFieldGroups={availableFieldGroups}
                  value={field.defaultValue ?? ""}
                  onChange={(nextValue) =>
                    onChange({
                      defaultValue: normalizeReferenceEditorValue(nextValue),
                    })
                  }
                  placeholder="Pre-filled value..."
                  multiline={hasMultilineDefaultValue}
                  className={
                    hasMultilineDefaultValue
                      ? "max-h-none min-h-24 overflow-hidden break-words"
                      : ""
                  }
                />
              )}
            </div>
          ) : null}

          {pluginBasicSettings}

          {supportsHalfWidth ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Half width
              </span>
              <Toggle
                checked={field.fieldWidth === "half"}
                onChange={(value) =>
                  onChange({ fieldWidth: value ? "half" : undefined })
                }
              />
            </div>
          ) : null}

          {!isDisplayOnly ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Required
              </span>
              <Toggle
                checked={field.required}
                onChange={(value) => onChange({ required: value })}
              />
            </div>
          ) : null}
        </Section>

        {hasOptions || showPluginOptionsSettings ? (
          <Section label="Options">
            {!showPluginOptionsSettings && hasOptions ? (
              <>
                <div className="space-y-1.5">
                  {options.map((option, idx) => (
                    <div key={`${option}-${idx}`} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={option}
                        onChange={(event) =>
                          updateOption(idx, event.target.value)
                        }
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                      />
                      <button
                        onClick={() => removeOption(idx)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-300 transition-colors hover:text-red-400"
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={addOption}
                    className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
                  >
                    <PlusIcon size={12} weight="bold" />
                    Add option
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => setShowBulk((value) => !value)}
                    className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                  >
                    Bulk add
                  </button>
                </div>

                {showBulk ? (
                  <div className="mt-1 space-y-1.5">
                    <textarea
                      value={bulkText}
                      onChange={(event) => setBulkText(event.target.value)}
                      placeholder={"One option per line\nOption A\nOption B"}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                    />
                    <button
                      onClick={applyBulk}
                      className="w-full rounded-lg bg-primary-500 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
                    >
                      Add options
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}

            {showPluginOptionsSettings ? pluginOptionsSettings : null}
          </Section>
        ) : null}

        {supportsLogic ? (
          <Section label="Logic" defaultOpen={false}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Hide always
              </span>
              <Toggle
                checked={field.hideAlways ?? false}
                onChange={(value) => onChange({ hideAlways: value || undefined })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-600">
                  Hide conditionally
                </span>
                <HelpTooltip>
                  Show or hide this field based on answers to earlier questions
                </HelpTooltip>
              </div>

              <div className="flex gap-1">
                {(["show", "hide"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChange({ conditionMode: mode })}
                    className={`flex flex-1 items-center justify-center rounded-md border bg-white py-1 text-xs font-medium transition-colors ${
                      (field.conditionMode ?? "show") === mode
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {mode === "show" ? "Show when" : "Hide when"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={(event) => {
                  if (conditionOpen) {
                    setConditionOpenFieldId(null);
                    setConditionAnchorEl(null);
                    return;
                  }

                  setConditionAnchorEl(event.currentTarget);
                  setConditionOpenFieldId(field.id);
                }}
                className={`flex w-full items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  hasConditions || conditionOpen
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <ConditionalLogicIcon />
                Set conditional logic
                {hasConditions ? (
                  <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
                    {countConditionNodes(conditionTree)}
                  </span>
                ) : null}
              </button>
            </div>
          </Section>
        ) : null}

        {showValidationSection ? (
          <Section label="Validation" defaultOpen={false}>
            {!showPluginValidationSettings &&
            HAS_SELECTION_VALIDATION.includes(field.type) ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Min selections</Label>
                    <input
                      type="number"
                      value={field.validationMinSelection ?? ""}
                      onChange={(event) =>
                        onChange({
                          validationMinSelection: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      min={0}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label>Max selections</Label>
                    <input
                      type="number"
                      value={field.validationMaxSelection ?? ""}
                      onChange={(event) =>
                        onChange({
                          validationMaxSelection: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      min={0}
                      placeholder="∞"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <Label tooltip="Shown when selection count is outside allowed range">
                    Error message
                  </Label>
                  <input
                    type="text"
                    value={field.validationErrorMessage ?? ""}
                    onChange={(event) =>
                      onChange({
                        validationErrorMessage: event.target.value || undefined,
                      })
                    }
                    placeholder="Please select the required number of options"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Label tooltip="Overrides the default 'This question is required' message">
                    Custom required message
                  </Label>
                  <input
                    type="text"
                    value={field.validationMessage ?? ""}
                    onChange={(event) =>
                      onChange({
                        validationMessage: event.target.value || undefined,
                      })
                    }
                    placeholder="This question is required."
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                  />
                </div>
              </>
            ) : null}

            {!showPluginValidationSettings && hasValidation ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Min length</Label>
                    <input
                      type="number"
                      value={field.validationMinLength ?? ""}
                      onChange={(event) =>
                        onChange({
                          validationMinLength: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      min={0}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label>Max length</Label>
                    <input
                      type="number"
                      value={field.validationMaxLength ?? ""}
                      onChange={(event) =>
                        onChange({
                          validationMaxLength: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        })
                      }
                      min={0}
                      placeholder="∞"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <Label>Validation pattern</Label>
                  <select
                    value={field.validationPattern ?? "none"}
                      onChange={(event) =>
                        onChange({
                          validationEmailDomain:
                            event.target.value === "email"
                              ? field.validationEmailDomain
                              : undefined,
                          validationPattern:
                            event.target.value === "none"
                              ? undefined
                            : event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                  >
                    {VALIDATION_PATTERNS.map((pattern) => (
                      <option key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </option>
                    ))}
                  </select>
                </div>

                {field.validationPattern === "email" ? (
                  <div>
                    <Label tooltip="Optional. Example: @binus.ac.id only allows emails ending with that domain. Leave empty to allow any email.">
                      Email domain
                    </Label>
                    <input
                      type="text"
                      value={field.validationEmailDomain ?? ""}
                      onChange={(event) =>
                        onChange({
                          validationEmailDomain:
                            event.target.value || undefined,
                        })
                      }
                      placeholder="@binus.ac.id"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                    />
                  </div>
                ) : null}

                <div>
                  <Label tooltip="Shown to the user when their answer fails validation">
                    Error message
                  </Label>
                  <input
                    type="text"
                    value={field.validationErrorMessage ?? ""}
                    onChange={(event) =>
                      onChange({
                        validationErrorMessage: event.target.value || undefined,
                      })
                    }
                    placeholder="Please enter a valid value"
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Label tooltip="Overrides the default 'This question is required' message">
                    Custom required message
                  </Label>
                  <input
                    type="text"
                    value={field.validationMessage ?? ""}
                    onChange={(event) =>
                      onChange({
                        validationMessage: event.target.value || undefined,
                      })
                    }
                    placeholder="This question is required."
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                  />
                </div>
              </>
            ) : null}

            {!showPluginValidationSettings && showDefaultValidationSection ? (
              <div>
                <Label tooltip="Overrides the default 'This question is required' message">
                  Custom required message
                </Label>
                <input
                  type="text"
                  value={field.validationMessage ?? ""}
                  onChange={(event) =>
                    onChange({
                      validationMessage: event.target.value || undefined,
                    })
                  }
                  placeholder="This question is required."
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-300 placeholder:text-gray-400"
                />
              </div>
            ) : null}

            {showPluginValidationSettings ? pluginValidationSettings : null}
          </Section>
        ) : null}

        {pluginFileSizeSettings ? (
          <Section label="File size" defaultOpen={false}>
            {pluginFileSizeSettings}
          </Section>
        ) : null}

        {pluginAdvancedSettings ? (
          <Section label="Advanced" defaultOpen={false}>
            {pluginAdvancedSettings}
          </Section>
        ) : null}
      </div>

      {conditionOpen ? (
        <ConditionPopup
          tree={conditionTree}
          availableFields={availableFields}
          fieldTypeLabels={CONDITION_FIELD_TYPE_LABELS}
          onUpdate={updateConditionTree}
          onClose={() => {
            setConditionOpenFieldId(null);
            setConditionAnchorEl(null);
          }}
          anchorEl={conditionAnchorEl}
          resetKey={field.id}
        />
      ) : null}
    </div>
  );
}
