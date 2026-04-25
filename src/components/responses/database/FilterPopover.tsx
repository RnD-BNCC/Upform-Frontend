import { useEffect, useMemo, useRef, useState } from "react";
import { FunnelSimpleIcon, XIcon } from "@phosphor-icons/react";
import type { FormField } from "@/types/form";
import type { ResultFilterGroup } from "@/types/results";
import ResultConditionEditorPanel from "../conditions/ResultConditionEditorPanel";
import {
  countFilterConditions,
  createId,
} from "./resultsDatabaseUtils";

type FilterPopoverProps = {
  align?: "left" | "right";
  autoAddFirstCondition?: boolean;
  deferApply?: boolean;
  fields: FormField[];
  filterGroup: ResultFilterGroup;
  onChange: (group: ResultFilterGroup) => void;
  popoverWidthClassName?: string;
  triggerVariant?: "default" | "icon";
};

function createEmptyGroup(): ResultFilterGroup {
  return {
    id: createId("result-condition-root"),
    type: "group",
    logic: "and",
    items: [],
  };
}

export default function FilterPopover({
  align = "left",
  autoAddFirstCondition = false,
  deferApply = false,
  fields,
  filterGroup,
  onChange,
  popoverWidthClassName = "w-[760px]",
  triggerVariant = "default",
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draftGroup, setDraftGroup] = useState(filterGroup);
  const rootRef = useRef<HTMLDivElement>(null);
  const filterCount = useMemo(
    () => countFilterConditions(filterGroup),
    [filterGroup],
  );
  const workingGroup = deferApply ? draftGroup : filterGroup;
  const setWorkingGroup = deferApply ? setDraftGroup : onChange;

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

  const handleTriggerClick = () => {
    setOpen((current) => {
      const nextOpen = !current;
      if (nextOpen) {
        const nextGroup =
          filterGroup.id && filterGroup.type === "group"
            ? filterGroup
            : createEmptyGroup();
        setDraftGroup(nextGroup);

        if (autoAddFirstCondition && nextGroup.items.length === 0) {
          setWorkingGroup(nextGroup);
        }
      }
      return nextOpen;
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleTriggerClick}
        className={
          triggerVariant === "icon"
            ? "relative flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
            : "flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        }
        aria-label="Filter"
      >
        <FunnelSimpleIcon size={16} />
        {triggerVariant === "default" ? (
          <>
            {filterCount === 0
              ? "Filter"
              : `${filterCount} filter${filterCount > 1 ? "s" : ""}`}
            {filterCount > 0 ? (
              <XIcon
                size={14}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange({ ...filterGroup, items: [] });
                }}
                className="text-gray-400 hover:text-gray-700"
              />
            ) : null}
          </>
        ) : filterCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[10px] font-bold text-white">
            {filterCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={`absolute top-12 z-[120] ${
            align === "right" ? "right-0" : "left-0"
          } ${popoverWidthClassName}`}
        >
          <ResultConditionEditorPanel
            fields={fields}
            group={workingGroup}
            onChange={setWorkingGroup}
            onApply={
              deferApply
                ? () => {
                    onChange(draftGroup);
                    setOpen(false);
                  }
                : undefined
            }
          />
        </div>
      ) : null}
    </div>
  );
}
