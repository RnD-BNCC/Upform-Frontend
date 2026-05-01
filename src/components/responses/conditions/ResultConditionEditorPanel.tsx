import ConditionSelect, {
  closeConditionSelectMenus,
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";
import { ConditionTrashIcon } from "@/components/icons";
import type { FormField } from "@/types/form";
import type {
  ResultFilterCondition,
  ResultFilterGroup,
  ResultFilterLogic,
  ResultFilterOperator,
} from "@/types/results";
import {
  DEFAULT_FILTER_GROUP,
  createId,
  getOperatorLabel,
} from "../database/resultsDatabaseUtils";
import { cleanResultLabel } from "../resultsResponseUtils";

type ResultConditionEditorPanelProps = {
  fields: FormField[];
  group: ResultFilterGroup;
  onApply?: () => void;
  onChange: (group: ResultFilterGroup) => void;
};

type ConditionNodeListProps = {
  depth?: number;
  fields: FormField[];
  group: ResultFilterGroup;
  onChange: (group: ResultFilterGroup) => void;
};

type ConditionGroupBlockProps = ConditionNodeListProps & {
  onRemove: () => void;
};

type ConditionLeafRowProps = {
  fields: FormField[];
  leaf: ResultFilterCondition;
  onChange: (leaf: ResultFilterCondition) => void;
  onRemove: () => void;
};

const LOGIC_OPTIONS: ConditionSelectOption[] = [
  { value: "and", label: "and" },
  { value: "or", label: "or" },
];

const TEXT_OPERATORS: ConditionSelectOption[] = [
  { value: "equals", label: getOperatorLabel("equals") },
  { value: "not_equals", label: getOperatorLabel("not_equals") },
  { value: "contains", label: getOperatorLabel("contains") },
  { value: "not_contains", label: getOperatorLabel("not_contains") },
  { value: "is_filled", label: "is not empty" },
  { value: "is_empty", label: getOperatorLabel("is_empty") },
];

const CHOICE_OPERATORS: ConditionSelectOption[] = [
  { value: "equals", label: getOperatorLabel("equals") },
  { value: "not_equals", label: getOperatorLabel("not_equals") },
  { value: "is_filled", label: "is not empty" },
  { value: "is_empty", label: getOperatorLabel("is_empty") },
];

const MULTI_VALUE_OPERATORS: ConditionSelectOption[] = [
  { value: "contains", label: "has any of" },
  { value: "not_contains", label: "has none of" },
  { value: "equals", label: getOperatorLabel("equals") },
  { value: "is_filled", label: "is not empty" },
  { value: "is_empty", label: getOperatorLabel("is_empty") },
];

const MULTI_VALUE_FIELD_TYPES = new Set<FormField["type"]>([
  "checkbox",
  "file_upload",
  "multiselect",
  "ranking",
]);

const CHOICE_FIELD_TYPES = new Set<FormField["type"]>([
  "dropdown",
  "linear_scale",
  "multiple_choice",
  "opinion_scale",
  "rating",
  "single_checkbox",
]);

function getOperatorOptions(field?: FormField): ConditionSelectOption[] {
  if (!field) return TEXT_OPERATORS;
  if (MULTI_VALUE_FIELD_TYPES.has(field.type)) return MULTI_VALUE_OPERATORS;
  if (CHOICE_FIELD_TYPES.has(field.type)) return CHOICE_OPERATORS;
  return TEXT_OPERATORS;
}

function getDefaultOperator(field?: FormField): ResultFilterOperator {
  return (getOperatorOptions(field)[0]?.value ?? "equals") as ResultFilterOperator;
}

function needsConditionValue(operator: ResultFilterOperator) {
  return operator !== "is_filled" && operator !== "is_empty";
}

function getGroupSummaryText(logic: ResultFilterLogic) {
  return logic === "and"
    ? "All of the following are true"
    : "Any of the following are true";
}

function createCondition(fields: FormField[]): ResultFilterCondition {
  const firstField = fields[0];
  return {
    id: createId("result-condition"),
    type: "condition",
    fieldId: firstField?.id ?? "",
    operator: getDefaultOperator(firstField),
    value: "",
  };
}

function createGroup(): ResultFilterGroup {
  return {
    id: createId("result-condition-group"),
    type: "group",
    logic: "and",
    items: [],
  };
}

function CompactLogicSelect({
  logic,
  onChange,
}: {
  logic: ResultFilterLogic;
  onChange: (logic: ResultFilterLogic) => void;
}) {
  return (
    <ConditionSelect
      value={logic}
      placeholder="Select..."
      options={LOGIC_OPTIONS}
      onChange={(value) => onChange(value as ResultFilterLogic)}
      menuWidth={110}
      menuPlacement="bottom"
      triggerClassName="w-full rounded-md px-2 text-[12px] font-medium text-gray-600"
    />
  );
}

function ConditionFieldSelect({
  fields,
  onChange,
  value,
}: {
  fields: FormField[];
  onChange: (fieldId: string) => void;
  value: string;
}) {
  const fieldOptions = fields.map((field) => ({
    label: cleanResultLabel(field.label),
    searchText: field.type,
    value: field.id,
  }));

  return (
    <div className="relative flex w-[150px] min-w-0 max-h-10">
      <ConditionSelect
        value={value}
        placeholder="Select..."
        options={fieldOptions}
        searchable
        searchPlaceholder="Search fields..."
        onChange={onChange}
        menuPlacement="auto"
        triggerClassName="rounded-l-md rounded-r-none border-r-0 px-2 text-[13px] text-gray-600"
      />
    </div>
  );
}

function ConditionLeafRow({
  fields,
  leaf,
  onChange,
  onRemove,
}: ConditionLeafRowProps) {
  const selectedField = fields.find((field) => field.id === leaf.fieldId);
  const operatorOptions = getOperatorOptions(selectedField);
  const hasValue = needsConditionValue(leaf.operator);

  return (
    <div className="flex items-center gap-0">
      <div className="my-2 flex min-w-0">
        <ConditionFieldSelect
          fields={fields}
          value={leaf.fieldId}
          onChange={(fieldId) => {
            const nextField = fields.find((field) => field.id === fieldId);
            const operatorStillValid = getOperatorOptions(nextField).some(
              (operator) => operator.value === leaf.operator,
            );
            const operator = operatorStillValid
              ? leaf.operator
              : getDefaultOperator(nextField);

            onChange({
              ...leaf,
              fieldId,
              operator,
              value: needsConditionValue(operator) ? leaf.value : "",
            });
          }}
        />

        <div className="w-[150px] min-w-0">
          <ConditionSelect
            value={leaf.operator}
            placeholder="Select..."
            options={operatorOptions}
            onChange={(operatorValue) => {
              const operator = operatorValue as ResultFilterOperator;
              onChange({
                ...leaf,
                operator,
                value: needsConditionValue(operator) ? leaf.value : "",
              });
            }}
            menuWidth={240}
            menuPlacement="top"
            triggerClassName="rounded-none px-2 text-[13px] text-gray-600"
          />
        </div>

        {hasValue ? (
          <input
            value={leaf.value}
            onFocus={() => closeConditionSelectMenus()}
            onChange={(event) => onChange({ ...leaf, value: event.target.value })}
            placeholder="value"
            className="h-10 min-h-10 w-[150px] min-w-[150px] rounded-none border border-l-0 border-gray-300 bg-white px-3 py-[10px] text-[13px] text-gray-700 outline-none placeholder:text-[13px] placeholder:text-gray-400 focus:border-gray-400"
          />
        ) : (
          <div className="h-10 w-[150px] min-w-[150px] rounded-none border border-l-0 border-gray-300 bg-white" />
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

function ConditionNodeList({
  depth = 0,
  fields,
  group,
  onChange,
}: ConditionNodeListProps) {
  return (
    <>
      {group.items.map((item, index) => {
        const removeItem = () =>
          onChange({
            ...group,
            items: group.items.filter((_, itemIndex) => itemIndex !== index),
          });

        if (item.type === "condition") {
          return (
            <ConditionLeafRow
              key={item.id}
              fields={fields}
              leaf={item}
              onRemove={removeItem}
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
            key={item.id}
            depth={depth + 1}
            fields={fields}
            group={item}
            onRemove={removeItem}
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

function ConditionGroupBlock({
  depth = 0,
  fields,
  group,
  onChange,
  onRemove,
}: ConditionGroupBlockProps) {
  const isEmpty = group.items.length === 0;
  const showLogicSelect = group.items.length > 1;
  const canAddNestedGroup = depth < 3;

  const addLeaf = () => {
    closeConditionSelectMenus();
    onChange({ ...group, items: [...group.items, createCondition(fields)] });
  };

  const addSubGroup = () => {
    closeConditionSelectMenus();
    onChange({ ...group, items: [...group.items, createGroup()] });
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
          <div className="pt-2 pl-3 text-[12px] font-medium text-gray-400">
            Press the plus to add conditions to group
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            {showLogicSelect ? (
              <div className="mt-2 w-[110px] pr-2">
                <CompactLogicSelect
                  logic={group.logic}
                  onChange={(logic) => onChange({ ...group, logic })}
                />
              </div>
            ) : null}
            <div className="flex w-full min-w-0 flex-col justify-start">
              <ConditionNodeList
                depth={depth + 1}
                fields={fields}
                group={group}
                onChange={onChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultConditionEditorPanel({
  fields,
  group,
  onApply,
  onChange,
}: ResultConditionEditorPanelProps) {
  const hasItems = group.items.length > 0;
  const showLogicSelect = group.items.length > 1;

  const addLeaf = () => {
    closeConditionSelectMenus();
    onChange({ ...group, items: [...group.items, createCondition(fields)] });
  };

  const addGroup = () => {
    closeConditionSelectMenus();
    onChange({ ...group, items: [...group.items, createGroup()] });
  };

  return (
    <div className="inline-flex min-w-[400px] rounded-md border-2 border-gray-200 bg-white px-4 py-2 shadow-xl">
      <div className="flex w-full flex-col">
        <div className="flex max-h-[48vh] overflow-y-auto overflow-hidden">
          {!hasItems ? (
            <div className="flex pt-1 pl-3 text-[12px] font-medium text-gray-400">
              No conditions specified yet
            </div>
          ) : (
            <div className="min-w-[450px]">
              <div className="flex justify-between">
                {showLogicSelect ? (
                  <div className="mt-2 w-[110px] pr-2">
                    <CompactLogicSelect
                      logic={group.logic}
                      onChange={(logic) => onChange({ ...group, logic })}
                    />
                  </div>
                ) : null}
                <div className="flex w-full min-w-0 flex-col justify-start">
                  <ConditionNodeList fields={fields} group={group} onChange={onChange} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_FILTER_GROUP, items: [] })}
              className="text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              Clear all
            </button>
            {onApply ? (
              <button
                type="button"
                onClick={() => {
                  closeConditionSelectMenus();
                  onApply();
                }}
                className="rounded-md bg-gray-950 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-gray-800"
              >
                Apply
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
