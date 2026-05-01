import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FunnelSimpleIcon } from "@phosphor-icons/react";
import type { FormField } from "@/types/form";
import type { ResultFilterGroup } from "@/types/results";
import ResultConditionEditorPanel from "../conditions/ResultConditionEditorPanel";
import { countFilterConditions } from "../database/resultsDatabaseUtils";

type AnalyticsConditionPopoverProps = {
  fields: FormField[];
  value: ResultFilterGroup;
  onApply: (group: ResultFilterGroup) => void;
};

const POPOVER_WIDTH = 760;
const VIEWPORT_PADDING = 12;

type PopoverPosition = {
  left: number;
  top: number;
  width: number;
};

export default function AnalyticsConditionPopover({
  fields,
  onApply,
  value,
}: AnalyticsConditionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ResultFilterGroup>(value);
  const [position, setPosition] = useState<PopoverPosition>({
    left: VIEWPORT_PADDING,
    top: 0,
    width: POPOVER_WIDTH,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const conditionCount = useMemo(() => countFilterConditions(value), [value]);

  const getPopoverPosition = useCallback((): PopoverPosition | null => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
    const left = Math.min(
      Math.max(rect.right - width, VIEWPORT_PADDING),
      window.innerWidth - width - VIEWPORT_PADDING,
    );

    return {
      left,
      top: rect.bottom + 8,
      width,
    };
  }, []);

  const updatePosition = useCallback(() => {
    const nextPosition = getPopoverPosition();
    if (nextPosition) setPosition(nextPosition);
  }, [getPopoverPosition]);

  const toggleOpen = useCallback(() => {
    setDraft(value);
    setOpen((current) => {
      if (current) return false;
      const nextPosition = getPopoverPosition();
      if (nextPosition) setPosition(nextPosition);
      return true;
    });
  }, [getPopoverPosition, value]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

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

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
        aria-label="Analytics conditions"
      >
        <FunnelSimpleIcon size={16} />
        {conditionCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-950 px-1 text-[10px] font-bold text-white">
            {conditionCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed z-[120] flex justify-end"
          style={{
            left: position.left,
            top: position.top,
            width: position.width,
          }}
        >
          <ResultConditionEditorPanel
            fields={fields}
            group={draft}
            onChange={setDraft}
            onApply={() => {
              onApply(draft);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
