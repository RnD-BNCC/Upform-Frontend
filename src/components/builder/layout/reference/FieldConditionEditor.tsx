import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  ConditionGroup,
  ConditionLeaf,
  ConditionOperator,
  FormField,
} from "@/types/form";
import {
  getDateReferenceLabel,
  getReferenceCalculationLabel,
  type DateReferenceOption,
} from "@/utils/form/referenceTokens";
import ConditionSelect, {
  closeConditionSelectMenus,
  type ConditionSelectOption,
} from "./ConditionSelect";
import ReferencePickerPopover from "./ReferencePickerPopover";
import { useReferenceCalculations } from "./ReferenceCalculationContext";
import ReferenceTextEditor from "./ReferenceTextEditor";
import { ChevronDownIcon, ConditionTrashIcon } from "@/components/icons";

type LogicType = "and" | "or";

const TEXT_OPERATORS: ConditionSelectOption[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is_filled", label: "is not empty" },
  { value: "is_empty", label: "is empty" },
];

const CHOICE_OPERATORS: ConditionSelectOption[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "is_filled", label: "is not empty" },
  { value: "is_empty", label: "is empty" },
];

const MULTI_VALUE_OPERATORS: ConditionSelectOption[] = [
  { value: "contains", label: "has any of" },
  { value: "not_contains", label: "has none of" },
  { value: "equals", label: "equals" },
  { value: "is_filled", label: "is not empty" },
  { value: "is_empty", label: "is empty" },
];

const LOGIC_OPTIONS: ConditionSelectOption[] = [
  { value: "and", label: "and" },
  { value: "or", label: "or" },
];

const MULTI_VALUE_FIELD_TYPES = new Set<FormField["type"]>([
  "checkbox",
  "multiselect",
  "ranking",
  "file_upload",
]);

const CHOICE_FIELD_TYPES = new Set<FormField["type"]>([
  "dropdown",
  "multiple_choice",
  "single_checkbox",
  "rating",
  "linear_scale",
  "opinion_scale",
]);

function getFieldLabel(
  field: FormField,
  fieldTypeLabels: Record<string, string>,
) {
  return field.label?.trim() || fieldTypeLabels[field.type] || field.type;
}

function getOperatorOptions(field?: FormField): ConditionSelectOption[] {
  if (!field) return TEXT_OPERATORS;
  if (MULTI_VALUE_FIELD_TYPES.has(field.type)) return MULTI_VALUE_OPERATORS;
  if (CHOICE_FIELD_TYPES.has(field.type)) return CHOICE_OPERATORS;
  return TEXT_OPERATORS;
}

function needsConditionValue(operator: ConditionOperator) {
  return operator !== "is_filled" && operator !== "is_empty";
}

function getDefaultOperator(field?: FormField): ConditionOperator {
  return (getOperatorOptions(field)[0]?.value ?? "equals") as ConditionOperator;
}

function getConditionSourceLabel(
  leaf: Pick<ConditionLeaf, "fieldId" | "sourceKind" | "sourceAmount"> | undefined,
  availableFields: FormField[],
  calculations: ReturnType<typeof useReferenceCalculations>,
  fieldTypeLabels: Record<string, string>,
) {
  if (!leaf?.fieldId) return "Select...";

  const sourceKind = leaf.sourceKind ?? "field";

  if (sourceKind === "calculation") {
    const calculation = calculations.find(
      (entry) => entry.id === leaf.fieldId,
    );
    return calculation
      ? getReferenceCalculationLabel(calculation)
      : "Calculation";
  }

  if (sourceKind === "date") {
    return getDateReferenceLabel(leaf.fieldId as DateReferenceOption["id"], leaf.sourceAmount);
  }

  const selectedField = availableFields.find((field) => field.id === leaf.fieldId);
  return selectedField
    ? getFieldLabel(selectedField, fieldTypeLabels)
    : "Select...";
}

function ConditionFieldPicker({
  availableFields,
  calculations,
  fieldTypeLabels,
  onChange,
  value,
}: {
  availableFields: FormField[];
  calculations: ReturnType<typeof useReferenceCalculations>;
  fieldTypeLabels: Record<string, string>;
  onChange: (
    nextValue: Pick<ConditionLeaf, "fieldId" | "sourceKind" | "sourceAmount">,
  ) => void;
  value?: Pick<ConditionLeaf, "fieldId" | "sourceKind" | "sourceAmount">;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const hasSelection = Boolean(value?.fieldId);
  const selectedLabel = getConditionSourceLabel(
    value,
    availableFields,
    calculations,
    fieldTypeLabels,
  );

  return (
    <div
      className="relative flex w-[150px] min-w-0 max-h-10"
      data-cy="reference-picker"
    >
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          closeConditionSelectMenus();
          setOpen((current) => !current);
        }}
        className="group flex h-10 w-full cursor-pointer rounded-l-md rounded-r-none border border-gray-300 border-r-0 bg-white pl-2 pr-[10px] text-gray-400 transition duration-100 hover:border-gray-400 hover:bg-gray-50 focus:!ring focus:!ring-offset-0 focus:ring-gray-300"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-grow truncate">
            <div
              className={`truncate py-[2.25px] pl-1 text-[13px] select-none ${
                hasSelection ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {selectedLabel}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center space-x-2">
            <div className="h-5 border-l border-gray-200" />
            <ChevronDownIcon
              size={16}
              className={`text-gray-400 transition-transform group-hover:text-gray-600 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      <ReferencePickerPopover
        allowDateUtilities
        anchorEl={anchorRef.current}
        autoFocusSearch
        availableFields={availableFields}
        availableCalculations={calculations}
        open={open}
        onClose={() => setOpen(false)}
        onSelectField={(field) => {
          onChange({
            fieldId: field.id,
            sourceKind: "field",
            sourceAmount: undefined,
          });
          setOpen(false);
        }}
        onSelectCalculation={(calculation) => {
          onChange({
            fieldId: calculation.id,
            sourceKind: "calculation",
            sourceAmount: undefined,
          });
          setOpen(false);
        }}
        onSelectDate={(option, amount) => {
          onChange({
            fieldId: option.id,
            sourceKind: "date",
            sourceAmount: amount,
          });
          setOpen(false);
        }}
      />
    </div>
  );
}

function getGroupSummaryText(logic: LogicType) {
  return logic === "and"
    ? "All of the following are true"
    : "Any of the following are true";
}

function CompactLogicSelect({
  logic,
  onChange,
  className = "",
  menuPlacement = "bottom",
}: {
  logic: LogicType;
  onChange: (logic: LogicType) => void;
  className?: string;
  menuPlacement?: "bottom" | "top";
}) {
  return (
    <div className={className}>
      <ConditionSelect
        value={logic}
        placeholder="Select..."
        options={LOGIC_OPTIONS}
        onChange={(value) => onChange(value as LogicType)}
        menuWidth={110}
        menuPlacement={menuPlacement}
        triggerClassName="w-full rounded-md px-2 text-[12px] font-medium text-gray-600"
      />
    </div>
  );
}

function ConditionLeafRow({
  leaf,
  availableFields,
  fieldTypeLabels,
  onChange,
  onRemove,
}: {
  leaf: ConditionLeaf;
  availableFields: FormField[];
  fieldTypeLabels: Record<string, string>;
  onChange: (leaf: ConditionLeaf) => void;
  onRemove: () => void;
}) {
  const calculations = useReferenceCalculations();
  const selectedField =
    (leaf.sourceKind ?? "field") === "field"
      ? availableFields.find((field) => field.id === leaf.fieldId)
      : undefined;
  const operatorOptions = getOperatorOptions(selectedField);
  const hasValue = needsConditionValue(leaf.operator);

  return (
    <div className="flex items-center gap-0">
      <div className="my-2 flex min-w-0">
        <ConditionFieldPicker
          value={leaf}
          availableFields={availableFields}
          calculations={calculations}
          fieldTypeLabels={fieldTypeLabels}
          onChange={(nextValue) => {
            const nextField =
              (nextValue.sourceKind ?? "field") === "field"
                ? availableFields.find(
                    (field) => field.id === nextValue.fieldId,
                  )
                : undefined;
            const nextOperator = getOperatorOptions(nextField).some(
              (operator) => operator.value === leaf.operator,
            );
            const normalizedOperator = nextOperator
              ? leaf.operator
              : getDefaultOperator(nextField);

            onChange({
              ...leaf,
              ...nextValue,
              operator: normalizedOperator,
              value: needsConditionValue(normalizedOperator)
                ? (leaf.value ?? "")
                : undefined,
            });
          }}
        />

        <div className="w-[150px] min-w-0" data-cy="condition-picker-condition">
          <ConditionSelect
            value={leaf.operator}
            placeholder="Select..."
            options={operatorOptions}
            onChange={(operatorValue) => {
              const nextOperator = operatorValue as ConditionOperator;
              onChange({
                ...leaf,
                operator: nextOperator,
                value: needsConditionValue(nextOperator)
                  ? (leaf.value ?? "")
                  : undefined,
              });
            }}
            menuWidth={240}
            menuPlacement="top"
            triggerClassName="rounded-none px-2 text-[13px] text-gray-600"
          />
        </div>

        {hasValue ? (
          <div className="w-[150px] min-w-[150px]" data-cy="condition-picker-value">
            <ReferenceTextEditor
              allowDateUtilities
              availableFields={availableFields}
              value={leaf.value ?? ""}
              onChange={(nextValue) => onChange({ ...leaf, value: nextValue })}
              onFocus={() => closeConditionSelectMenus()}
              placeholder="value"
              placeholderClassName="px-3 py-[10px] text-[13px] text-gray-400"
              className="h-10 min-h-10 w-full rounded-none border border-gray-300 border-l-0 bg-white px-3 py-[10px] text-[13px] text-gray-700 focus:border-gray-400"
            />
          </div>
        ) : (
          <div
            className="h-10 w-[150px] min-w-[150px] rounded-none border border-gray-300 border-l-0 bg-white"
            data-cy="condition-picker-value"
          />
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-md rounded-l-none border border-gray-300 bg-white px-2 text-gray-500 transition-colors hover:bg-gray-100"
      >
        <ConditionTrashIcon size={14} className="text-gray-400" />
      </button>
    </div>
  );
}

function ConditionGroupBlock({
  group,
  availableFields,
  fieldTypeLabels,
  onChange,
  onRemove,
  depth = 0,
}: {
  group: ConditionGroup;
  availableFields: FormField[];
  fieldTypeLabels: Record<string, string>;
  onChange: (group: ConditionGroup) => void;
  onRemove: () => void;
  depth?: number;
}) {
  const isEmpty = group.items.length === 0;
  const showLogicSelect = group.items.length > 1;
  const canAddNestedGroup = depth < 3;

  const addLeaf = () => {
    closeConditionSelectMenus();
    const firstField = availableFields[0];

    const newLeaf: ConditionLeaf = {
      type: "condition",
      sourceKind: "field",
      fieldId: firstField?.id ?? "",
      operator: getDefaultOperator(firstField),
      value: "",
    };
    onChange({ ...group, items: [...group.items, newLeaf] });
  };

  const addSubGroup = () => {
    closeConditionSelectMenus();
    onChange({
      ...group,
      items: [...group.items, { type: "group", logic: "and", items: [] }],
    });
  };

  return (
    <div
      className="my-2 rounded-md border py-2 pl-5 pr-2"
      style={{ backgroundColor: "#f3f4f6", borderColor: "#d1d5db" }}
    >
      <div className="min-w-[450px]">
        <div className="flex justify-between gap-2">
          <div className="flex pt-1 pl-3 text-[12px] font-medium text-gray-400">
            {getGroupSummaryText(group.logic)}
          </div>
          <div className="mr-2 flex shrink-0 items-center justify-end whitespace-nowrap">
            <button
              type="button"
              onClick={addLeaf}
              className="cursor-pointer text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-600"
            >
              + Condition
            </button>
            {canAddNestedGroup ? (
              <button
                type="button"
                onClick={addSubGroup}
                className="cursor-pointer pl-2 text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-600"
              >
                + Group
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                closeConditionSelectMenus();
                onRemove();
              }}
              className="ml-2 flex cursor-pointer rounded p-1 text-gray-500 transition-colors hover:bg-gray-300"
            >
              <ConditionTrashIcon size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {isEmpty ? (
          <>
            <div className="flex justify-between" />
            <div className="pt-2 pl-3 text-[12px] font-medium text-gray-400">
              Press the plus to add conditions to group
            </div>
          </>
        ) : (
          <div className="flex justify-between gap-2">
            {showLogicSelect ? (
              <CompactLogicSelect
                logic={group.logic}
                onChange={(logic) => onChange({ ...group, logic })}
                className="mt-2 w-[110px] pr-2"
              />
            ) : null}
            <div className="flex w-full min-w-0 flex-col justify-start">
              <ConditionNodeList
                group={group}
                availableFields={availableFields}
                fieldTypeLabels={fieldTypeLabels}
                onChange={onChange}
                depth={depth + 1}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionNodeList({
  group,
  availableFields,
  fieldTypeLabels,
  onChange,
  depth = 0,
}: {
  group: ConditionGroup;
  availableFields: FormField[];
  fieldTypeLabels: Record<string, string>;
  onChange: (group: ConditionGroup) => void;
  depth?: number;
}) {
  return (
    <>
      {group.items.map((item, index) => {
        const onRemove = () =>
          onChange({
            ...group,
            items: group.items.filter((_, itemIndex) => itemIndex !== index),
          });

        if (item.type === "condition") {
          return (
            <ConditionLeafRow
              key={index}
              leaf={item}
              availableFields={availableFields}
              fieldTypeLabels={fieldTypeLabels}
              onRemove={onRemove}
              onChange={(updated) =>
                onChange({
                  ...group,
                  items: group.items.map((entry, itemIndex) =>
                    itemIndex === index ? updated : entry,
                  ),
                })
              }
            />
          );
        }

        return (
          <ConditionGroupBlock
            key={index}
            group={item}
            availableFields={availableFields}
            fieldTypeLabels={fieldTypeLabels}
            depth={depth + 1}
            onRemove={onRemove}
            onChange={(updated) =>
              onChange({
                ...group,
                items: group.items.map((entry, itemIndex) =>
                  itemIndex === index ? updated : entry,
                ),
              })
            }
          />
        );
      })}
    </>
  );
}

type ConditionPopupProps = {
  tree: ConditionGroup;
  availableFields: FormField[];
  fieldTypeLabels: Record<string, string>;
  onUpdate: (tree: ConditionGroup) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  resetKey?: string | number;
};

type ConditionEditorPanelProps = {
  tree: ConditionGroup;
  availableFields: FormField[];
  fieldTypeLabels: Record<string, string>;
  onUpdate: (tree: ConditionGroup) => void;
  onDone?: () => void;
  containerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
};

export function ConditionEditorPanel({
  tree,
  availableFields,
  fieldTypeLabels,
  onUpdate,
  onDone,
  containerClassName = "",
  contentClassName = "flex max-h-[40vh] overflow-y-auto overflow-hidden",
  footerClassName = "flex items-center justify-between pt-2",
}: ConditionEditorPanelProps) {
  const hasItems = tree.items.length > 0;
  const showLogicSelect = tree.items.length > 1;

  const addLeaf = () => {
    closeConditionSelectMenus();
    const firstField = availableFields[0];

    const newLeaf: ConditionLeaf = {
      type: "condition",
      sourceKind: "field",
      fieldId: firstField?.id ?? "",
      operator: getDefaultOperator(firstField),
      value: "",
    };
    onUpdate({ ...tree, items: [...tree.items, newLeaf] });
  };

  const addGroup = () => {
    closeConditionSelectMenus();
    const newGroup: ConditionGroup = { type: "group", logic: "and", items: [] };
    onUpdate({ ...tree, items: [...tree.items, newGroup] });
  };

  return (
    <div
      className={`inline-flex min-w-[400px] rounded-md border-2 border-gray-200 bg-white px-4 py-2 shadow-xl ${containerClassName}`}
    >
      <div className="flex w-full flex-col">
        <div className="flex justify-between" />
        <div className={contentClassName}>
          {!hasItems ? (
            <div className="flex pt-1 pl-3 text-[12px] font-medium text-gray-400">
              No conditions specified yet
            </div>
          ) : (
            <div className="min-w-[450px]">
              <div className="flex justify-between">
                {showLogicSelect ? (
                  <CompactLogicSelect
                    logic={tree.logic}
                    onChange={(logic) => onUpdate({ ...tree, logic })}
                    className="mt-2 w-[110px] pr-2"
                  />
                ) : null}
                <div className="flex w-full min-w-0 flex-col justify-start">
                  <ConditionNodeList
                    group={tree}
                    availableFields={availableFields}
                    fieldTypeLabels={fieldTypeLabels}
                    onChange={onUpdate}
                    depth={0}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={footerClassName}>
          <div className="flex">
            <button
              type="button"
              onClick={addLeaf}
              className="cursor-pointer text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-600"
            >
              + Add condition
            </button>
            <button
              type="button"
              onClick={addGroup}
              className="cursor-pointer pl-2 text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-600"
            >
              + Add condition group
            </button>
          </div>

          {onDone ? (
            <button
              type="button"
              data-cy="condition-picker-done-button"
              onClick={() => {
                closeConditionSelectMenus();
                onDone();
              }}
              className="flex justify-end text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              Done
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ConditionPopup({
  tree,
  availableFields,
  fieldTypeLabels,
  onUpdate,
  onClose,
  anchorEl,
  resetKey,
}: ConditionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [draftTree, setDraftTree] = useState(tree);

  useEffect(() => {
    closeConditionSelectMenus();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const targetElement =
        target instanceof Element ? target : target.parentElement;
      if (
        targetElement?.closest('[data-condition-select-root="true"]') ||
        targetElement?.closest('[data-reference-picker-root="true"]') ||
        popupRef.current?.contains(target) ||
        anchorEl?.contains(target)
      ) {
        return;
      }

      onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [anchorEl, onClose]);

  useEffect(() => {
    closeConditionSelectMenus();
    setDraftTree(tree);
  }, [anchorEl, resetKey]);

  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const popupWidth = Math.min(640, window.innerWidth - 24);
  const position = {
    top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 320)),
    left: Math.max(
      12,
      Math.min(rect.left, window.innerWidth - popupWidth - 12),
    ),
  };

  return createPortal(
    <div
      ref={popupRef}
      data-condition-popup-root="true"
      className="fixed z-[9999]"
      style={{ top: position.top, left: position.left, maxWidth: popupWidth }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <ConditionEditorPanel
        tree={draftTree}
        availableFields={availableFields}
        fieldTypeLabels={fieldTypeLabels}
        onUpdate={(nextTree) => {
          setDraftTree(nextTree);
          onUpdate(nextTree);
        }}
        onDone={onClose}
        containerClassName="max-h-[70vh]"
      />
    </div>,
    document.body,
  );
}
