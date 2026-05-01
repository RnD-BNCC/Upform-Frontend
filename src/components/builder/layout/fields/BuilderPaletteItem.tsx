import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FieldType } from "@/types/form";

type Props = {
  label: string;
  icon: React.ReactNode;
  iconBgClassName: string;
  dragId: string;
  onClick: () => void;
  fieldType?: FieldType | null;
  disabled?: boolean;
  title?: string;
  className?: string;
  labelClassName?: string;
  iconWrapperClassName?: string;
};

const DEFAULT_CARD_CLASS =
  "rounded-sm border border-gray-100 bg-white text-center transition-all hover:shadow-sm";
const DEFAULT_LABEL_CLASS = "text-[10px] font-medium text-center text-gray-600";
const DEFAULT_ICON_WRAPPER_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";

export default function BuilderPaletteItem({
  label,
  icon,
  iconBgClassName,
  dragId,
  onClick,
  fieldType,
  disabled = false,
  title,
  className = "",
  labelClassName = DEFAULT_LABEL_CLASS,
  iconWrapperClassName = DEFAULT_ICON_WRAPPER_CLASS,
}: Props) {
  const isDraggable = !disabled && Boolean(fieldType);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette:${dragId}`,
      data: { fieldType },
      disabled: !isDraggable,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`${DEFAULT_CARD_CLASS} ${
        isDraggable ? "cursor-grab active:cursor-grabbing touch-none" : "cursor-pointer"
      } ${isDragging ? "opacity-40" : ""} ${className}`}
      title={title ?? label}
    >
      <span className={`${iconWrapperClassName} ${iconBgClassName}`}>{icon}</span>
      <span className={labelClassName}>{label}</span>
    </button>
  );
}
