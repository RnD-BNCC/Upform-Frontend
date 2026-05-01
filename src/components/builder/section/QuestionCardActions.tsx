import { useEffect, useRef } from "react";
import {
  ArrowsClockwiseIcon,
  CopySimpleIcon,
  DotsNineIcon,
  GearSixIcon,
  TextTIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import type { FieldType } from "@/types/form";
import HelpTooltip from "@/components/builder/layout/shared/HelpTooltip";
import { FIELD_TYPE_META, SIMILAR_TYPES } from "./fieldTypeMeta";

type DragHandleProps = {
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
  visible: boolean;
};

type FloatingActionsProps = {
  fieldType: FieldType;
  isMenuOpen: boolean;
  showFieldTools: boolean;
  onChangeType: (type: FieldType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMenuOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
  onSelect: () => void;
};

export function QuestionCardDragHandle({
  dragProps,
  visible,
}: DragHandleProps) {
  return (
    <div
      {...dragProps}
      onClick={(event) => event.stopPropagation()}
      className={`w-6 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 transition-opacity touch-none self-stretch ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <DotsNineIcon size={14} weight="bold" />
    </div>
  );
}

function ChangeTypeMenu({
  fieldType,
  onChangeType,
}: {
  fieldType: FieldType;
  onChangeType: (type: FieldType) => void;
}) {
  const similar = SIMILAR_TYPES[fieldType] ?? [];
  if (similar.length === 0) return null;

  return (
    <div className="absolute right-full top-0 mr-1 z-[200] bg-white rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 p-2 w-64">
      <div className="flex items-center gap-1 px-1 pb-2 border-b border-gray-100 mb-2">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider flex">
          Change to
        </p>
        <HelpTooltip>Switch this field to a compatible type</HelpTooltip>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {similar.map((type) => {
          const meta = FIELD_TYPE_META[type];
          const Icon = meta?.Icon ?? TextTIcon;
          return (
            <button
              key={type}
              onClick={(event) => {
                event.stopPropagation();
                onChangeType(type);
              }}
              className="flex flex-col items-center shadow-sm gap-1.5 p-2 rounded-sm hover:bg-gray-50 transition-colors"
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-md ${
                  meta?.iconBg ?? "bg-gray-100 text-gray-500"
                }`}
              >
                <Icon size={16} />
              </span>
              <span className="text-[9px] text-center leading-tight text-gray-600">
                {meta?.label ?? type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuestionCardFloatingActions({
  fieldType,
  isMenuOpen,
  showFieldTools,
  onChangeType,
  onDelete,
  onDuplicate,
  onMenuOpenChange,
  onOpenSettings,
  onSelect,
}: FloatingActionsProps) {
  const changeTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (
        changeTypeRef.current &&
        !changeTypeRef.current.contains(event.target as Node)
      ) {
        onMenuOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isMenuOpen, onMenuOpenChange]);

  return (
    <div
      className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+36px)] transition-opacity flex flex-col gap-1 z-50 ${
        showFieldTools
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
          onOpenSettings?.();
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-primary-600 hover:border-primary-200 transition-colors"
        title="Settings"
      >
        <GearSixIcon size={13} />
      </button>
      {(SIMILAR_TYPES[fieldType]?.length ?? 0) > 0 && (
        <div className="relative" ref={changeTypeRef}>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onMenuOpenChange(!isMenuOpen);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
            title="Change type"
          >
            <ArrowsClockwiseIcon size={13} />
          </button>
          {isMenuOpen && (
            <ChangeTypeMenu
              fieldType={fieldType}
              onChangeType={(type) => {
                onChangeType(type);
                onMenuOpenChange(false);
              }}
            />
          )}
        </div>
      )}
      {fieldType !== "next_button" && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors"
          title="Duplicate"
        >
          <CopySimpleIcon size={13} />
        </button>
      )}
      {fieldType !== "next_button" && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          title="Delete"
        >
          <TrashSimpleIcon size={13} />
        </button>
      )}
    </div>
  );
}
