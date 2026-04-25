import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CaretDownIcon,
  CalculatorIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  CheckSquareIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeSimpleIcon,
  FileTextIcon,
  HashIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  RadioButtonIcon,
  SlidersHorizontalIcon,
  SortAscendingIcon,
  StarIcon,
  TextAaIcon,
  TextAlignLeftIcon,
  TextTIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { FormCalculation, FormField } from "@/types/form";
import type { ConditionFieldGroup } from "@/utils/form/conditionFields";
import { emitOpenLogicModal } from "@/utils/form/logicModalEvents";
import {
  DATE_REFERENCE_OPTIONS,
  getReferenceCalculationLabel,
  getReferenceFieldLabel,
  type DateReferenceOption,
  type ReferencePickerTabId,
} from "@/utils/form/referenceTokens";
import { closeConditionSelectMenus } from "./ConditionSelect";
import { useReferenceCalculations } from "./ReferenceCalculationContext";

type Props = {
  allowDateUtilities?: boolean;
  anchorEl: HTMLElement | null;
  autoFocusSearch?: boolean;
  availableFields: FormField[];
  availableCalculations?: FormCalculation[];
  fieldGroups?: ConditionFieldGroup[];
  open: boolean;
  onClose: () => void;
  onSelectCalculation?: (calculation: FormCalculation) => void;
  onSelectDate: (option: DateReferenceOption, amount?: number) => void;
  onSelectField: (field: FormField) => void;
};

const TAB_ITEMS: Array<{
  emptyDescription: string;
  icon: ReactNode;
  id: ReferencePickerTabId;
  label: string;
  testId: string;
}> = [
  {
    id: "pagesAndWidgets",
    label: "Pages and widgets",
    testId: "reference-picker-tab-pagesAndWidgets",
    emptyDescription: "No fields yet",
    icon: <FileTextIcon size={18} weight="fill" />,
  },
  {
    id: "calculations",
    label: "Calculations",
    testId: "reference-picker-tab-calculations",
    emptyDescription: "No calculations yet",
    icon: <CalculatorIcon size={18} weight="fill" />,
  },
  {
    id: "dateUtilities",
    label: "Date utilities",
    testId: "reference-picker-tab-dateUtilities",
    emptyDescription: "No date utilities yet",
    icon: <CalendarBlankIcon size={18} weight="fill" />,
  },
];

const FIELD_ICON_META: Partial<
  Record<FormField["type"], { borderColor: string; icon: ReactNode; textColor: string }>
> = {
  short_text: {
    icon: <TextTIcon size={14} weight="fill" />,
    borderColor: "#22c55e",
    textColor: "#22c55e",
  },
  long_text: {
    icon: <TextAlignLeftIcon size={14} weight="fill" />,
    borderColor: "#22c55e",
    textColor: "#22c55e",
  },
  rich_text: {
    icon: <TextAaIcon size={14} weight="fill" />,
    borderColor: "#22c55e",
    textColor: "#22c55e",
  },
  email: {
    icon: <EnvelopeSimpleIcon size={14} weight="fill" />,
    borderColor: "#06b6d4",
    textColor: "#06b6d4",
  },
  file_upload: {
    icon: <UploadSimpleIcon size={14} weight="fill" />,
    borderColor: "#4f46e5",
    textColor: "#4f46e5",
  },
  dropdown: {
    icon: <CaretDownIcon size={14} weight="bold" />,
    borderColor: "#f59e0b",
    textColor: "#f59e0b",
  },
  checkbox: {
    icon: <CheckSquareIcon size={14} weight="fill" />,
    borderColor: "#f59e0b",
    textColor: "#f59e0b",
  },
  multiple_choice: {
    icon: <RadioButtonIcon size={14} weight="fill" />,
    borderColor: "#f59e0b",
    textColor: "#f59e0b",
  },
  multiselect: {
    icon: <ListChecksIcon size={14} weight="fill" />,
    borderColor: "#f59e0b",
    textColor: "#f59e0b",
  },
  ranking: {
    icon: <SortAscendingIcon size={14} weight="fill" />,
    borderColor: "#eab308",
    textColor: "#eab308",
  },
  single_checkbox: {
    icon: <CheckSquareIcon size={14} weight="fill" />,
    borderColor: "#f59e0b",
    textColor: "#f59e0b",
  },
  rating: {
    icon: <StarIcon size={14} weight="fill" />,
    borderColor: "#eab308",
    textColor: "#eab308",
  },
  linear_scale: {
    icon: <SlidersHorizontalIcon size={14} weight="fill" />,
    borderColor: "#eab308",
    textColor: "#eab308",
  },
  opinion_scale: {
    icon: <ChartBarIcon size={14} weight="fill" />,
    borderColor: "#eab308",
    textColor: "#eab308",
  },
  number: {
    icon: <HashIcon size={14} weight="fill" />,
    borderColor: "#8b5cf6",
    textColor: "#8b5cf6",
  },
  currency: {
    icon: <CurrencyDollarIcon size={14} weight="fill" />,
    borderColor: "#8b5cf6",
    textColor: "#8b5cf6",
  },
  date: {
    icon: <CalendarBlankIcon size={14} weight="fill" />,
    borderColor: "#8b5cf6",
    textColor: "#8b5cf6",
  },
  time: {
    icon: <ClockIcon size={14} weight="fill" />,
    borderColor: "#8b5cf6",
    textColor: "#8b5cf6",
  },
  phone: {
    icon: <PhoneIcon size={14} weight="fill" />,
    borderColor: "#06b6d4",
    textColor: "#06b6d4",
  },
  address: {
    icon: <MapPinIcon size={14} weight="fill" />,
    borderColor: "#06b6d4",
    textColor: "#06b6d4",
  },
};

function getFieldIcon(field: FormField) {
  const meta = FIELD_ICON_META[field.type];
  if (!meta) {
    return (
      <div
        className="rounded-sm border-[0.5px] p-[2px] text-gray-400"
        style={{ backgroundColor: "#f3f4f6", borderColor: "#4b5563" }}
      >
        <FileTextIcon size={14} weight="fill" />
      </div>
    );
  }

  return (
    <div
      className="rounded-sm border-[0.5px] p-[2px] flex-shrink-0"
      style={{
        backgroundColor: "#f3f4f6",
        borderColor: meta.borderColor,
        color: meta.textColor,
      }}
    >
      {meta.icon}
    </div>
  );
}

function getCalculationIcon() {
  return (
    <div
      className="flex-shrink-0 rounded-sm border-[0.5px] p-[2px]"
      style={{
        backgroundColor: "#eff6ff",
        borderColor: "#2563eb",
        color: "#2563eb",
      }}
    >
      <CalculatorIcon size={14} weight="fill" />
    </div>
  );
}

function EmptyState({
  activeTab,
  onOpenCalculations,
}: {
  activeTab: ReferencePickerTabId;
  onOpenCalculations: () => void;
}) {
  const activeConfig = TAB_ITEMS.find((tab) => tab.id === activeTab);

  return (
    <div className="flex flex-grow">
      <div className="flex h-full w-full flex-col items-center justify-center px-6">
        <FileTextIcon size={28} weight="fill" className="mb-2 text-gray-400" />
        <h3 className="mt-2 mb-0 max-w-sm pb-0 text-center text-sm font-semibold text-gray-700">
          Nothing found to reference yet
        </h3>
        <p className="mt-1 mb-4 pb-0 text-center text-sm text-gray-500">
          {activeConfig?.emptyDescription ?? "No references yet"}
        </p>
        {activeTab === "calculations" ? (
          <button
            type="button"
            onClick={onOpenCalculations}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-700"
          >
            <CalculatorIcon size={13} weight="fill" />
            Open calculations
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ReferencePickerPopover({
  allowDateUtilities = true,
  anchorEl,
  autoFocusSearch = false,
  availableFields,
  availableCalculations,
  fieldGroups,
  open,
  onClose,
  onSelectCalculation,
  onSelectDate,
  onSelectField,
}: Props) {
  const contextCalculations = useReferenceCalculations();
  const [activeTab, setActiveTab] =
    useState<ReferencePickerTabId>("pagesAndWidgets");
  const [search, setSearch] = useState("");
  const calculations = availableCalculations ?? contextCalculations;
  const visibleTabs = useMemo(
    () =>
      TAB_ITEMS.filter((tab) => {
        if (tab.id === "calculations") {
          return typeof onSelectCalculation === "function";
        }

        if (tab.id === "dateUtilities") {
          return allowDateUtilities;
        }

        return true;
      }),
    [allowDateUtilities, onSelectCalculation],
  );

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setActiveTab(visibleTabs[0]?.id ?? "pagesAndWidgets");
    closeConditionSelectMenus();
  }, [open, visibleTabs]);

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === activeTab)) return;
    setActiveTab(visibleTabs[0]?.id ?? "pagesAndWidgets");
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const targetElement =
        target instanceof Element ? target : target.parentElement;
      if (
        targetElement?.closest('[data-reference-picker-root="true"]') ||
        anchorEl?.contains(target)
      ) {
        return;
      }

      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorEl, onClose, open]);

  const filteredFieldGroups = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    const sourceGroups =
      fieldGroups && fieldGroups.length > 0
        ? fieldGroups
        : [
            {
              sectionId: "fields",
              sectionLabel: "",
              fields: availableFields,
            },
          ];

    return sourceGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => {
          const label = getReferenceFieldLabel(field);
          const haystack = `${label} ${field.type}`.toLowerCase();
          return !lowerSearch || haystack.includes(lowerSearch);
        }),
      }))
      .filter((group) => group.fields.length > 0);
  }, [availableFields, fieldGroups, search]);

  const filteredDates = useMemo(() => {
    if (!allowDateUtilities) return [];

    const lowerSearch = search.trim().toLowerCase();
    return DATE_REFERENCE_OPTIONS.filter((option) => {
      return !lowerSearch || option.label.toLowerCase().includes(lowerSearch);
    });
  }, [allowDateUtilities, search]);

  const filteredCalculations = useMemo(() => {
    if (typeof onSelectCalculation !== "function") return [];

    const lowerSearch = search.trim().toLowerCase();
    return calculations.filter((calculation) => {
      const label = getReferenceCalculationLabel(calculation);
      const haystack = `${label} ${calculation.type}`.toLowerCase();
      return !lowerSearch || haystack.includes(lowerSearch);
    });
  }, [calculations, onSelectCalculation, search]);

  if (!open || !anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const popupWidth = Math.min(400, window.innerWidth - 24);
  const popupHeight = 272;
  const position = {
    top: Math.max(
      12,
      Math.min(rect.bottom + 5, window.innerHeight - popupHeight - 12),
    ),
    left: Math.max(
      12,
      Math.min(rect.left, window.innerWidth - popupWidth - 12),
    ),
  };

  const showFields = activeTab === "pagesAndWidgets";
  const showCalculations = activeTab === "calculations";
  const showDates = activeTab === "dateUtilities";
  const hasItems = showFields
    ? filteredFieldGroups.length > 0
    : showCalculations
      ? filteredCalculations.length > 0
    : showDates
      ? filteredDates.length > 0
      : false;

  return createPortal(
    <div
      data-reference-picker-root="true"
      className="fixed z-[10000] flex h-[272px] w-[400px] max-w-[400px] rounded-md border border-gray-200 bg-white shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        width: popupWidth,
        maxWidth: popupWidth,
        marginTop: 5,
        marginBottom: 5,
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col flex-shrink-0 rounded-l-md bg-gray-100 pl-1">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <div key={tab.id}>
              <button
                type="button"
                data-cy={tab.testId}
                title={tab.label}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer rounded-l-md py-[6px] pl-1 pr-2 transition-colors ${
                  isActive ? "bg-white" : "hover:bg-gray-200"
                }`}
              >
                <span
                  className={`block ${isActive ? "text-gray-500" : "text-gray-400"}`}
                >
                  {tab.icon}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-grow">
        {hasItems ? (
          <div className="flex h-full w-full max-w-full flex-col space-y-1">
            <div className="flex-shrink-0 px-2 pt-2">
              <div className="relative flex h-min items-center rounded-sm border border-gray-200 bg-white transition-colors focus-within:border-primary-300">
                <input
                  type="text"
                  autoFocus={autoFocusSearch}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="h-[28px] w-full rounded-sm border-0 px-2 pr-8 text-sm font-normal text-brand-gray-700 outline-none placeholder:text-brand-gray-400 focus:ring-0"
                />
                <MagnifyingGlassIcon
                  size={14}
                  className="absolute right-2 text-gray-300"
                />
              </div>
            </div>

            <div className="max-w-full flex-grow overflow-y-auto pt-1">
              <div className="pl-1 pb-2">
                {showFields
                  ? filteredFieldGroups.map((group) => (
                      <div key={group.sectionId} className="pb-1">
                        {group.sectionLabel ? (
                          <div className="px-[8px] pb-1 pt-2 text-[11px] font-medium text-gray-400">
                            {group.sectionLabel}
                          </div>
                        ) : null}

                        {group.fields.map((field) => (
                          <div
                            key={field.id}
                            className="flex max-w-full w-full flex-grow"
                            data-cy="reference-picker-row"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectField(field);
                                onClose();
                              }}
                              className="group ml-[2px] flex w-full max-w-full cursor-pointer items-center justify-between rounded-l-md px-[6px] py-2 transition duration-100 hover:bg-gray-100"
                            >
                              <div className="flex max-w-full items-center">
                                {getFieldIcon(field)}
                                <div className="ml-2 flex overflow-hidden text-[13px] font-medium text-gray-600 line-clamp-1">
                                  <div>{getReferenceFieldLabel(field)}</div>
                                </div>
                              </div>
                              <div className="hidden flex-shrink-0 items-center justify-end pr-1 group-hover:block">
                                <div className="flex h-full items-center" />
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  : showCalculations
                    ? filteredCalculations.map((calculation) => (
                        <div
                          key={calculation.id}
                          className="flex max-w-full w-full flex-grow"
                          data-cy="reference-picker-row"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCalculation?.(calculation);
                              onClose();
                            }}
                            className="group ml-[2px] flex w-full max-w-full cursor-pointer items-center justify-between rounded-l-md px-[6px] py-2 transition duration-100 hover:bg-gray-100"
                          >
                            <div className="flex max-w-full items-center">
                              {getCalculationIcon()}
                              <div className="ml-2 flex overflow-hidden text-[13px] font-medium text-gray-600 line-clamp-1">
                                <div>{getReferenceCalculationLabel(calculation)}</div>
                              </div>
                            </div>
                            <div className="hidden flex-shrink-0 items-center justify-end pr-1 group-hover:block">
                              <div className="flex h-full items-center" />
                            </div>
                          </button>
                        </div>
                      ))
                  : filteredDates.map((option) => (
                      <div
                        key={option.id}
                        className="flex max-w-full w-full flex-grow"
                        data-cy="reference-picker-row"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            let amount: number | undefined;

                            if (option.requiresAmount) {
                              const rawValue = window.prompt("How many days?", "7");
                              if (rawValue === null) return;

                              const parsedValue = Number.parseInt(rawValue, 10);
                              if (
                                !Number.isFinite(parsedValue) ||
                                parsedValue < 0
                              ) {
                                return;
                              }

                              amount = parsedValue;
                            }

                            onSelectDate(option, amount);
                            onClose();
                          }}
                          className="group ml-[2px] flex w-full max-w-full cursor-pointer items-center justify-between rounded-l-md px-[6px] py-2 transition duration-100 hover:bg-gray-100"
                        >
                          <div className="flex max-w-full items-center">
                            <div
                              className="rounded-sm border-[0.5px] p-[2px] flex-shrink-0"
                              style={{
                                backgroundColor: "#f3f4f6",
                                borderColor: "#4b5563",
                                color: "#9ca3af",
                              }}
                            >
                              <CalendarBlankIcon size={14} weight="fill" />
                            </div>
                            <div className="ml-2 flex overflow-hidden text-[13px] font-medium text-gray-600 line-clamp-1">
                              <div>{option.label}</div>
                            </div>
                          </div>
                          <div className="hidden flex-shrink-0 items-center justify-end pr-1 group-hover:block">
                            <div className="flex h-full items-center" />
                          </div>
                        </button>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            activeTab={activeTab}
            onOpenCalculations={() => {
              onClose();
              emitOpenLogicModal("calculations");
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
