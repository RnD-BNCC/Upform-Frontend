import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalculatorIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CopySimpleIcon,
  DotsThreeVerticalIcon,
  HashIcon,
  PlusIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import { ConfirmModal } from "@/components/modal";
import { ConditionalLogicIcon } from "@/components/icons";
import { ConditionPopup } from "@/components/builder/layout";
import ConditionSelect, {
  type ConditionSelectOption,
} from "@/components/builder/layout/reference/ConditionSelect";
import ReferencePickerPopover from "@/components/builder/layout/reference/ReferencePickerPopover";
import ReferenceTextEditor from "@/components/builder/layout/reference/ReferenceTextEditor";
import {
  CONDITION_FIELD_TYPE_LABELS,
  createDateReferenceTokenHtml,
  createFieldReferenceTokenHtml,
  stripHtmlToText,
} from "@/utils/form";
import type {
  CalculationDurationUnit,
  CalculationRule,
  CalculationType,
  ConditionGroup,
  ConditionNode,
  FormCalculation,
  FormField,
} from "@/types/form";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import type { LogicModalCalculationsController } from "@/hooks/builder/useLogicModalCalculations";

const CALCULATION_TYPE_SELECT_OPTIONS: ConditionSelectOption[] = (
  ["number", "text", "duration"] satisfies CalculationType[]
).map((option) => ({
  value: option,
  label: option,
}));

const CALCULATION_PRIMARY_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700";

const CALCULATION_SECONDARY_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-900";

const CALCULATION_SECTION_LABEL_CLASS = "text-base font-semibold text-gray-700";

const CALCULATION_RULE_LABEL_CLASS = "text-sm font-medium text-gray-500";

const CALCULATION_INITIAL_INPUT_CLASS =
  "h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-base font-medium leading-none text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-300";

const CALCULATION_SELECT_TRIGGER_CLASS =
  "h-10 rounded-lg border-gray-200 bg-white pl-3 pr-3";

const CALCULATION_SELECT_TEXT_CLASS = "text-sm font-medium text-gray-700";

const CALCULATION_SELECT_PLACEHOLDER_CLASS = "text-sm text-gray-400";

const CALCULATION_EDITOR_CLASS =
  "min-h-10 rounded-lg border-gray-200 px-3 py-[9px] text-sm font-medium text-gray-700";

const CALCULATION_EDITOR_PLACEHOLDER_CLASS =
  "px-3 py-[9px] text-sm text-gray-400";

const NUMBER_CALCULATION_RULE_OPERATION_OPTIONS: ConditionSelectOption[] = [
  { value: "add", label: "add" },
  { value: "subtract", label: "subtract" },
  { value: "multiply", label: "multiply by" },
  { value: "divide", label: "divide by" },
  { value: "set", label: "assign" },
];

const TEXT_CALCULATION_RULE_OPERATION_OPTIONS: ConditionSelectOption[] = [
  { value: "set", label: "assign" },
];

const DURATION_CALCULATION_UNIT_OPTIONS: ConditionSelectOption[] = (
  ["years", "months", "weeks", "days", "hours", "minutes"] satisfies CalculationDurationUnit[]
).map((unit) => ({
  value: unit,
  label: unit,
}));

function createEmptyConditionTree(): ConditionGroup {
  return {
    type: "group",
    logic: "and",
    items: [],
  };
}

function isCalculationRuleAlways(rule: CalculationRule) {
  return !rule.conditionTree;
}

function getCalculationRuleConditionCount(rule: CalculationRule) {
  return rule.conditionTree ? countConditionNodes(rule.conditionTree) : 0;
}

function getCalculationTypeBadgeClass(type: CalculationType) {
  if (type === "number") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (type === "duration") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-sky-100 text-sky-700";
}

function countConditionNodes(tree: ConditionGroup): number {
  return tree.items.reduce<number>((count, item: ConditionNode) => {
    return count + (item.type === "group" ? countConditionNodes(item) : 1);
  }, 0);
}

type Props = {
  controller: LogicModalCalculationsController;
  isSavingFlow: boolean;
};

function LogicModalToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
        checked ? "bg-primary-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function DurationReferenceSelect({
  availableFieldGroups,
  availableFields,
  onChange,
  placeholder,
  value,
}: {
  availableFieldGroups: ConditionFieldGroup[];
  availableFields: FormField[];
  onChange: (value: string) => void;
  placeholder: string;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const label = stripHtmlToText(value).trim();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-12 w-full items-center justify-between gap-2 overflow-hidden rounded-lg border border-gray-300 bg-white pl-4 pr-3 text-left transition-colors hover:border-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300"
      >
        <span
          className={`truncate text-sm font-medium ${
            label ? "text-gray-700" : "text-gray-400"
          }`}
        >
          {label || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-3 pl-2">
          <span className="h-6 border-l border-gray-200" />
          <CaretRightIcon
            size={16}
            className={`rotate-90 text-gray-400 transition-transform group-hover:text-gray-600 ${
              open ? "-rotate-90" : ""
            }`}
          />
        </span>
      </button>

      <ReferencePickerPopover
        allowDateUtilities
        anchorEl={triggerRef.current}
        autoFocusSearch
        availableFields={availableFields}
        fieldGroups={availableFieldGroups}
        open={open}
        onClose={() => setOpen(false)}
        onSelectDate={(option, amount) =>
          onChange(createDateReferenceTokenHtml(option, amount))
        }
        onSelectField={(field) => onChange(createFieldReferenceTokenHtml(field))}
      />
    </>
  );
}

function CalculationContextMenu({
  calculation,
  x,
  y,
  onClose,
  onDuplicate,
  onDelete,
}: {
  calculation: FormCalculation;
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: (calculation: FormCalculation) => void;
  onDelete: (calculation: FormCalculation) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const adjustedX = Math.min(x, window.innerWidth - 204);
  const adjustedY = Math.min(y, window.innerHeight - 132);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.08, ease: "easeOut" }}
      className="fixed z-[10020] w-40 select-none overflow-hidden rounded-sm border border-gray-100/80 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ left: adjustedX, top: adjustedY }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="px-3 pb-2 pt-2.5">
        <p
          className="truncate text-xs font-semibold text-gray-800"
          title={calculation.name}
        >
          {calculation.name}
        </p>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="py-1">
        <button
          type="button"
          onClick={() => onDuplicate(calculation)}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <CopySimpleIcon
            size={12}
            className="shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
          />
          Duplicate
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="py-1">
        <button
          type="button"
          onClick={() => onDelete(calculation)}
          className="group flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <TrashSimpleIcon
            size={12}
            className="shrink-0 transition-transform group-hover:scale-110"
          />
          Delete calculation
        </button>
      </div>
    </motion.div>
  );
}

export default function LogicModalCalculationsView({
  controller,
  isSavingFlow,
}: Props) {
  const {
    activeCalculationRuleCondition,
    calculationContextMenu,
    calculationDetail,
    calculationInitialValue,
    calculationItems,
    calculationRuleAvailableFieldGroups,
    calculationRuleAvailableFields,
    calculationRuleConditionEditorAnchorEl,
    calculationRuleConditionEditorRuleId,
    calculationView,
    clearPendingCalculationDelete,
    closeCalculationContextMenu,
    closeCalculationRuleConditionEditor,
    handleAddCalculationRule,
    handleCreateCalculation,
    handleDeleteCalculation,
    handleDeleteCalculationRule,
    handleDuplicateCalculation,
    handleSaveCalculationDetail,
    handleToggleCalculationRuleAlways,
    newCalculationName,
    newCalculationType,
    openCalculationContextMenu,
    openCreateCalculation,
    openCalculationDetail,
    openCalculationList,
    openCalculationRuleConditionEditor,
    pendingCalculationDelete,
    requestDeleteCalculation,
    setCalculationInitialValue,
    setNewCalculationName,
    setNewCalculationType,
    toggleCalculationContextMenu,
    updateCalculationDetail,
    updateCalculationRule,
  } = controller;

  return (
    <>
      <div className="mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-6 py-8">
        {calculationView === "empty" ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-2xl bg-gray-50 p-2.5 text-gray-400">
              <CalculatorIcon size={28} weight="duotone" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              No calculations yet
            </h3>
            <p className="mt-1.5 text-sm text-gray-500">
              Compute prices, quiz scores, and more!
            </p>
            <motion.button
              type="button"
              onClick={openCreateCalculation}
              whileTap={{ scale: 0.97 }}
              className={`mt-5 ${CALCULATION_PRIMARY_BUTTON_CLASS}`}
            >
              <PlusIcon size={14} weight="bold" />
              Add new calculation
            </motion.button>
          </div>
        ) : calculationView === "create" ? (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-y-auto pr-1">
            <div className="flex items-start border-b border-gray-100 pb-6">
              <button
                type="button"
                onClick={openCalculationList}
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                <CaretLeftIcon size={14} />
                Back
              </button>
            </div>

            <div className="pt-6">
              <h3 className="text-2xl font-semibold text-gray-700">
                New calculation
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Name your calculation and select what kind it is
              </p>
            </div>

            <div className="mt-10 max-w-2xl space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Name
                </label>
                <input
                  type="text"
                  value={newCalculationName}
                  onChange={(event) => setNewCalculationName(event.target.value)}
                  placeholder="e.g. price, score..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-300"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Type
                  </label>
                </div>
                <div className="w-[250px]">
                  <ConditionSelect
                    value={newCalculationType}
                    placeholder="Select type"
                    options={CALCULATION_TYPE_SELECT_OPTIONS}
                    onChange={(value) =>
                      setNewCalculationType(value as CalculationType)
                    }
                    menuPlacement="auto"
                    menuWidth={250}
                    triggerClassName="rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-end pt-8">
              <button
                type="button"
                onClick={handleCreateCalculation}
                disabled={isSavingFlow}
                className={`${CALCULATION_PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-70`}
              >
                Create calculation
              </button>
            </div>
          </div>
        ) : calculationView === "list" ? (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-y-auto pr-1">
            <div className="border-b border-gray-100 pb-8">
              <h3 className="text-2xl font-semibold text-gray-700">
                All calculations
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Choose a calculation below to modify it
              </p>
            </div>

            <div className="pt-3">
              <div className="space-y-4">
                {calculationItems.map((calculation) => (
                  <div key={calculation.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => openCalculationDetail(calculation)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openCalculationContextMenu(
                          calculation,
                          event.clientX,
                          event.clientY,
                        );
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-blue-500">
                          <HashIcon size={14} weight="bold" />
                          <span className="text-base font-semibold leading-none">
                            {calculation.name}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="absolute inset-y-0 right-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openCalculationDetail(calculation)}
                        className="hidden items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 md:inline-flex"
                      >
                        Edit
                        <CaretRightIcon size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          const rect =
                            event.currentTarget.getBoundingClientRect();
                          toggleCalculationContextMenu(
                            calculation,
                            rect.right - 12,
                            rect.bottom + 8,
                          );
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        aria-label={`Open actions for ${calculation.name}`}
                      >
                        <DotsThreeVerticalIcon size={18} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                type="button"
                onClick={openCreateCalculation}
                whileTap={{ scale: 0.97 }}
                className={`mt-8 ${CALCULATION_PRIMARY_BUTTON_CLASS}`}
              >
                <PlusIcon size={14} weight="bold" />
                New calculation
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto pr-1">
            {calculationDetail ? (
              <>
                <div className="sticky top-0 z-10 bg-white pb-4">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <button
                      type="button"
                      onClick={openCalculationList}
                      className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
                    >
                      <CaretLeftIcon size={14} />
                      Back
                    </button>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getCalculationTypeBadgeClass(
                        calculationDetail.type,
                      )}`}
                    >
                      {calculationDetail.type}
                    </span>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-2xl font-semibold leading-tight text-gray-700">
                      Calculate:{" "}
                      <span className="inline-flex items-center rounded-xl bg-blue-50 px-3 py-1 text-lg font-semibold leading-none text-blue-500">
                        {calculationDetail.name}
                      </span>
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-400">
                      {calculationDetail.type === "duration"
                        ? "Specify start and end dates or times and measure the duration between them"
                        : "Specify an initial value, then add or edit rules that change that value."}
                    </p>
                  </div>
                </div>

                {calculationDetail.type === "duration" ? (
                  <div className="mt-8 max-w-4xl">
                    <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-end">
                      <div>
                        <label className={`mb-3 block ${CALCULATION_SECTION_LABEL_CLASS}`}>
                          Start: <span className="text-red-500">*</span>
                        </label>
                        <DurationReferenceSelect
                          availableFieldGroups={calculationRuleAvailableFieldGroups}
                          availableFields={calculationRuleAvailableFields}
                          value={calculationDetail.durationStartValue}
                          placeholder="Select date or time"
                          onChange={(value) =>
                            updateCalculationDetail((calculation) => ({
                              ...calculation,
                              durationStartValue: value,
                            }))
                          }
                        />
                      </div>

                      <div className="hidden h-12 items-center justify-center pb-1 text-gray-400 md:flex">
                        <CaretRightIcon size={24} weight="bold" />
                      </div>

                      <div>
                        <label className={`mb-3 block ${CALCULATION_SECTION_LABEL_CLASS}`}>
                          End: <span className="text-red-500">*</span>
                        </label>
                        <DurationReferenceSelect
                          availableFieldGroups={calculationRuleAvailableFieldGroups}
                          availableFields={calculationRuleAvailableFields}
                          value={calculationDetail.durationEndValue}
                          placeholder="Select date or time"
                          onChange={(value) =>
                            updateCalculationDetail((calculation) => ({
                              ...calculation,
                              durationEndValue: value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-8 w-full max-w-[250px]">
                      <label
                        className={`mb-3 block ${CALCULATION_SECTION_LABEL_CLASS}`}
                      >
                        Units:
                      </label>
                      <ConditionSelect
                        value={calculationDetail.durationUnit ?? "days"}
                        placeholder="Select unit"
                        options={DURATION_CALCULATION_UNIT_OPTIONS}
                        onChange={(value) =>
                          updateCalculationDetail((calculation) => ({
                            ...calculation,
                            durationUnit: value as CalculationDurationUnit,
                          }))
                        }
                        menuWidth={250}
                        menuPlacement="auto"
                        placeholderTextClassName={
                          CALCULATION_SELECT_PLACEHOLDER_CLASS
                        }
                        selectedTextClassName={CALCULATION_SELECT_TEXT_CLASS}
                        triggerClassName="h-12 rounded-lg border-gray-300 bg-white pl-4 pr-3"
                      />
                    </div>

                    <div className="mt-10 flex justify-end pb-2">
                      <motion.button
                        type="button"
                        onClick={() => void handleSaveCalculationDetail()}
                        whileTap={{ scale: isSavingFlow ? 1 : 0.97 }}
                        disabled={isSavingFlow}
                        className={`${CALCULATION_PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        Done
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="max-w-3xl">
                      <div>
                        <label
                          className={`mb-2 block ${CALCULATION_SECTION_LABEL_CLASS}`}
                        >
                          Initial value:
                        </label>
                        <input
                          type="text"
                          inputMode={
                            calculationDetail.type === "number"
                              ? "decimal"
                              : "text"
                          }
                          value={
                            calculationDetail.type === "number" &&
                            calculationInitialValue &&
                            !/^-?\d*\.?\d*$/.test(calculationInitialValue)
                              ? ""
                              : calculationInitialValue
                          }
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            if (
                              calculationDetail.type === "number" &&
                              nextValue &&
                              !/^-?\d*\.?\d*$/.test(nextValue)
                            ) {
                              return;
                            }

                            setCalculationInitialValue(nextValue);
                          }}
                          placeholder={
                            calculationDetail.type === "number"
                              ? "e.g. 0"
                              : "e.g. pending"
                          }
                          className={CALCULATION_INITIAL_INPUT_CLASS}
                        />
                      </div>
                    </div>

                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className={CALCULATION_SECTION_LABEL_CLASS}>
                        Rules:
                      </div>
                      <div className="mt-5 space-y-4">
                        {(calculationDetail.rules ?? []).map((rule) => {
                          const isAlways = isCalculationRuleAlways(rule);
                          const conditionCount =
                            getCalculationRuleConditionCount(rule);
                          const operationOptions =
                            calculationDetail.type === "text"
                              ? TEXT_CALCULATION_RULE_OPERATION_OPTIONS
                              : NUMBER_CALCULATION_RULE_OPERATION_OPTIONS;
                          const selectedOperation =
                            calculationDetail.type === "text"
                              ? "set"
                              : rule.operation ?? "add";
                          const valuePlaceholder =
                            calculationDetail.type === "text"
                              ? "e.g. Approved, previous answer..."
                              : "e.g. 5, previous answer...";

                          return (
                            <div
                              key={rule.id}
                              className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className={CALCULATION_RULE_LABEL_CLASS}>
                                  When this is true:
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-400">
                                    Always
                                  </span>
                                  <LogicModalToggle
                                    checked={isAlways}
                                    onChange={(nextChecked) =>
                                      handleToggleCalculationRuleAlways(
                                        rule,
                                        nextChecked,
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteCalculationRule(rule.id)
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    aria-label="Delete rule"
                                  >
                                    <TrashSimpleIcon size={16} weight="bold" />
                                  </button>
                                </div>
                              </div>

                              {isAlways ? null : (
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    openCalculationRuleConditionEditor(
                                      rule,
                                      event.currentTarget,
                                    )
                                  }
                                  className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
                                    conditionCount > 0
                                      ? "border-primary-200 bg-primary-50/70 text-primary-700 hover:bg-primary-50"
                                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                                  }`}
                                >
                                  <ConditionalLogicIcon className="h-3.5 w-3.5" />
                                  <span>Set conditional logic</span>
                                  {conditionCount > 0 ? (
                                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-primary-700">
                                      {conditionCount}
                                    </span>
                                  ) : null}
                                </button>
                              )}

                              <div
                                className={`${isAlways ? "mt-3" : "mt-4"} ${CALCULATION_RULE_LABEL_CLASS}`}
                              >
                                Do the following:
                              </div>

                              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                <div className="w-full sm:w-[180px]">
                                  <ConditionSelect
                                    value={selectedOperation}
                                    placeholder="Select action"
                                    options={operationOptions}
                                    onChange={(value) =>
                                      updateCalculationRule(
                                        rule.id,
                                        (currentRule) => ({
                                          ...currentRule,
                                          operation:
                                            value as CalculationRule["operation"],
                                        }),
                                      )
                                    }
                                    menuWidth={180}
                                    menuPlacement="auto"
                                    placeholderTextClassName={
                                      CALCULATION_SELECT_PLACEHOLDER_CLASS
                                    }
                                    selectedTextClassName={
                                      CALCULATION_SELECT_TEXT_CLASS
                                    }
                                    triggerClassName={
                                      CALCULATION_SELECT_TRIGGER_CLASS
                                    }
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <ReferenceTextEditor
                                    allowDateUtilities={false}
                                    availableFields={
                                      calculationRuleAvailableFields
                                    }
                                    availableFieldGroups={
                                      calculationRuleAvailableFieldGroups
                                    }
                                    value={rule.value ?? ""}
                                    onChange={(value) =>
                                      updateCalculationRule(
                                        rule.id,
                                        (currentRule) => ({
                                          ...currentRule,
                                          value,
                                        }),
                                      )
                                    }
                                    placeholder={valuePlaceholder}
                                    placeholderClassName={
                                      CALCULATION_EDITOR_PLACEHOLDER_CLASS
                                    }
                                    className={CALCULATION_EDITOR_CLASS}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={handleAddCalculationRule}
                          disabled={isSavingFlow}
                          className={CALCULATION_SECONDARY_BUTTON_CLASS}
                        >
                          <PlusIcon size={14} weight="bold" />
                          New rule
                        </button>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                          <motion.button
                            type="button"
                            onClick={() => void handleSaveCalculationDetail()}
                            whileTap={{ scale: isSavingFlow ? 1 : 0.97 }}
                            disabled={isSavingFlow}
                            className={`${CALCULATION_PRIMARY_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            Done
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      <AnimatePresence>
        {calculationContextMenu ? (
          <CalculationContextMenu
            calculation={calculationContextMenu.calculation}
            x={calculationContextMenu.x}
            y={calculationContextMenu.y}
            onClose={closeCalculationContextMenu}
            onDuplicate={(calculation) => handleDuplicateCalculation(calculation)}
            onDelete={requestDeleteCalculation}
          />
        ) : null}
      </AnimatePresence>

      {calculationRuleConditionEditorRuleId &&
      calculationRuleConditionEditorAnchorEl ? (
        <ConditionPopup
          tree={
            activeCalculationRuleCondition?.conditionTree ??
            createEmptyConditionTree()
          }
          availableFields={calculationRuleAvailableFields}
          fieldTypeLabels={CONDITION_FIELD_TYPE_LABELS}
          onUpdate={(tree) =>
            updateCalculationRule(calculationRuleConditionEditorRuleId, (rule) => ({
              ...rule,
              conditionTree: tree,
            }))
          }
          onClose={closeCalculationRuleConditionEditor}
          anchorEl={calculationRuleConditionEditorAnchorEl}
          resetKey={calculationRuleConditionEditorRuleId}
        />
      ) : null}

      <ConfirmModal
        key="logic-modal-confirm-delete-calculation"
        isOpen={pendingCalculationDelete !== null}
        title="Delete Calculation"
        description={
          pendingCalculationDelete
            ? `Are you sure you want to delete "${pendingCalculationDelete.name}"?`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onClose={clearPendingCalculationDelete}
        onConfirm={() => {
          if (!pendingCalculationDelete) return;
          handleDeleteCalculation(pendingCalculationDelete.id);
        }}
      />
    </>
  );
}
