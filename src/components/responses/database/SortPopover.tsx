import { useEffect, useMemo, useRef, useState } from "react";
import {
  PlusIcon,
  SortAscendingIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import ConditionSelect from "@/components/builder/layout/reference/ConditionSelect";
import type { FormField } from "@/types/form";
import type { ResultSortDirection, ResultSortRule } from "@/types/results";
import { cleanResultLabel } from "../resultsResponseUtils";
import { createId } from "./resultsDatabaseUtils";

type SortPopoverProps = {
  fields: FormField[];
  sortRules: ResultSortRule[];
  onChange: (rules: ResultSortRule[]) => void;
};

const DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export default function SortPopover({
  fields,
  sortRules,
  onChange,
}: SortPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const fieldOptions = useMemo(
    () =>
      fields.map((field) => ({
        label: cleanResultLabel(field.label),
        value: field.id,
      })),
    [fields],
  );
  const firstSort = sortRules[0];
  const firstSortField = fields.find((field) => field.id === firstSort?.fieldId);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (rootRef.current?.contains(target)) return;
      if (target.closest("[data-condition-select-root]")) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const addSort = (fieldId?: string) => {
    const firstAvailable = fields.find(
      (field) => !sortRules.some((rule) => rule.fieldId === field.id),
    );
    const nextFieldId = fieldId ?? firstAvailable?.id;
    if (!nextFieldId) return;
    onChange([
      ...sortRules,
      { id: createId("sort"), fieldId: nextFieldId, direction: "asc" },
    ]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <SortAscendingIcon size={16} />
        {firstSortField ? `Sorted by ${cleanResultLabel(firstSortField.label)}` : "Sort"}
      </button>

      {open ? (
        <div className="absolute left-0 top-12 z-[120] w-[470px] rounded-md border border-gray-200 bg-white p-3 shadow-xl">
          <div className="space-y-2">
            {sortRules.length === 0 ? (
              <div className="w-56">
                <ConditionSelect
                  value=""
                  placeholder="Choose field"
                  options={fieldOptions}
                  searchable
                  searchPlaceholder="Search fields..."
                  onChange={(fieldId) => addSort(fieldId)}
                  menuPlacement="auto"
                  triggerClassName="h-10 rounded-md"
                />
              </div>
            ) : null}
            {sortRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2">
                <div className="w-48">
                  <ConditionSelect
                    value={rule.fieldId}
                    placeholder="Choose field"
                    options={fieldOptions}
                    searchable
                    searchPlaceholder="Search fields..."
                    onChange={(fieldId) =>
                      onChange(
                        sortRules.map((item) =>
                          item.id === rule.id ? { ...item, fieldId } : item,
                        ),
                      )
                    }
                    menuPlacement="auto"
                    triggerClassName="h-10 rounded-md"
                  />
                </div>
                <div className="w-40">
                  <ConditionSelect
                    value={rule.direction}
                    placeholder="Direction"
                    options={DIRECTION_OPTIONS}
                    onChange={(direction) =>
                      onChange(
                        sortRules.map((item) =>
                          item.id === rule.id
                            ? {
                                ...item,
                                direction: direction as ResultSortDirection,
                              }
                            : item,
                        ),
                      )
                    }
                    menuPlacement="auto"
                    triggerClassName="h-10 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange(sortRules.filter((item) => item.id !== rule.id))
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500"
                  aria-label="Remove sort"
                >
                  <TrashSimpleIcon size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addSort()}
            className="mt-3 flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <PlusIcon size={15} />
            Add sort
          </button>
        </div>
      ) : null}
    </div>
  );
}
