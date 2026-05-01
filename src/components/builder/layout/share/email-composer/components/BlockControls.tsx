import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PlusIcon } from "@phosphor-icons/react";
import type { PageMenuDropdownOption } from "@/components/builder/layout/form/PageMenuDropdown";
import PageMenuDropdown from "@/components/builder/layout/form/PageMenuDropdown";
import {
  BLOCK_ICON_CLASS_BY_TYPE,
  BLOCK_OPTIONS,
} from "../constants";
import type { EmailBlock } from "@/types/builderShare";

const BLOCK_MENU_OPTIONS: PageMenuDropdownOption[] = BLOCK_OPTIONS.map(
  ({ icon: Icon, label, type }) => ({
    icon: <Icon size={15} weight={type === "spacer" ? "bold" : "regular"} />,
    iconClassName: BLOCK_ICON_CLASS_BY_TYPE[type],
    id: type,
    label,
  }),
);

function getBlockOption(type: EmailBlock["type"]) {
  return BLOCK_OPTIONS.find((option) => option.type === type) ?? BLOCK_OPTIONS[0];
}

export function BlockTypeIcon({
  className = "h-8 w-8",
  type,
}: {
  className?: string;
  type: EmailBlock["type"];
}) {
  const option = getBlockOption(type);
  const Icon = option.icon;

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md ${className} ${BLOCK_ICON_CLASS_BY_TYPE[type]}`}
    >
      <Icon size={16} weight={type === "spacer" ? "bold" : "regular"} />
    </span>
  );
}

export function AddBlockDropdown({
  className = "",
  onAdd,
}: {
  className?: string;
  onAdd: (type: EmailBlock["type"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center justify-center ${className}`}
    >
      <button
        type="button"
        title="Add block"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-primary-400 bg-white text-primary-600 shadow-sm transition-colors hover:bg-primary-50"
      >
        <PlusIcon size={14} weight="bold" />
      </button>

      <AnimatePresence>
        {open ? (
          <div
            className="absolute left-1/2 top-8 z-40 -translate-x-1/2"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <PageMenuDropdown
              className="w-40 select-none overflow-hidden rounded-sm border border-gray-100/80 bg-white py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.13),0_2px_8px_rgba(0,0,0,0.06)]"
              options={BLOCK_MENU_OPTIONS}
              variant="field"
              onSelect={(type) => {
                onAdd(type as EmailBlock["type"]);
                setOpen(false);
              }}
            />
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function BlockInsertControl({
  isVisible = false,
  onAdd,
}: {
  isVisible?: boolean;
  onAdd: (type: EmailBlock["type"]) => void;
}) {
  return (
    <div className="group/insert relative z-30 h-0">
      <div
        className={`absolute inset-x-0 top-0 flex h-5 -translate-y-1/2 items-center justify-center transition-opacity group-hover/insert:opacity-100 group-focus-within/insert:opacity-100 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <AddBlockDropdown onAdd={onAdd} />
      </div>
    </div>
  );
}
