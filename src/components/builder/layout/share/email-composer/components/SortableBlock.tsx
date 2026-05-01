import { useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CopySimpleIcon,
  DotsNineIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react";
import { RichInput } from "@/components/builder/utils";
import {
  DEFAULT_IMAGE_MAX_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
} from "../constants";
import type { EmailBlock, EmailBlockPatch, ImageBlock } from "@/types/builderShare";
import { getImageWrapperClassName } from "../utils";

function EmailResizableImage({
  block,
  isSelected,
  onPickImage,
  onUpdate,
}: {
  block: ImageBlock;
  isSelected: boolean;
  onPickImage: () => void;
  onUpdate: (patch: EmailBlockPatch) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef({ startWidth: DEFAULT_IMAGE_WIDTH, startX: 0 });
  const align = block.align ?? "center";
  const width = align === "full" ? 100 : block.width ?? DEFAULT_IMAGE_WIDTH;

  const startResize = useCallback(
    (event: ReactMouseEvent, direction: "left" | "right") => {
      event.preventDefault();
      event.stopPropagation();
      resizeRef.current = { startWidth: width, startX: event.clientX };

      const handleMove = (moveEvent: MouseEvent) => {
        const containerWidth =
          wrapperRef.current?.parentElement?.getBoundingClientRect().width ?? 600;
        const delta =
          direction === "right"
            ? moveEvent.clientX - resizeRef.current.startX
            : resizeRef.current.startX - moveEvent.clientX;
        const nextWidth = Math.max(
          20,
          Math.min(
            100,
            resizeRef.current.startWidth + (delta / containerWidth) * 100,
          ),
        );
        onUpdate({
          align: align === "full" ? "center" : align,
          width: Math.round(nextWidth),
        });
      };

      const stopResize = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", stopResize);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", stopResize);
    },
    [align, onUpdate, width],
  );

  if (!block.url) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPickImage();
        }}
        className="flex h-28 w-full items-center justify-center rounded-md border border-dashed border-gray-300 bg-transparent text-xs font-semibold text-gray-400 transition-colors hover:border-primary-300 hover:text-primary-500"
      >
        Pick image
      </button>
    );
  }

  return (
    <div className={`flex w-full bg-transparent ${getImageWrapperClassName(block)}`}>
      <div
        ref={wrapperRef}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          onPickImage();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onPickImage();
          }
        }}
        className="group/email-image relative cursor-pointer"
        style={{ width: `${width}%` }}
      >
        <img
          src={block.url}
          alt=""
          className="block h-auto w-full rounded-md object-cover"
          style={{
            maxHeight: block.maxHeight ?? DEFAULT_IMAGE_MAX_HEIGHT,
          }}
        />
        <span
          className={`absolute inset-0 flex items-center justify-center rounded-md bg-black/25 text-sm font-semibold text-white transition-opacity ${
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover/email-image:opacity-100"
          }`}
        >
          <span className="underline underline-offset-2">Change image</span>
        </span>
        <span
          onMouseDown={(event) => startResize(event, "right")}
          onClick={(event) => event.stopPropagation()}
          className={`absolute right-0 top-1/2 z-10 h-8 w-3 -translate-y-1/2 translate-x-1/2 cursor-ew-resize rounded-full border border-gray-300 bg-white shadow-sm transition-opacity ${
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover/email-image:opacity-100"
          }`}
        />
        <span
          onMouseDown={(event) => startResize(event, "left")}
          onClick={(event) => event.stopPropagation()}
          className={`absolute left-0 top-1/2 z-10 h-8 w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border border-gray-300 bg-white shadow-sm transition-opacity ${
            isSelected
              ? "opacity-100"
              : "opacity-0 group-hover/email-image:opacity-100"
          }`}
        />
      </div>
    </div>
  );
}

type SortableBlockProps = {
  block: EmailBlock;
  isSelected: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onPickImage: () => void;
  onSelect: () => void;
  onUpdate: (patch: EmailBlockPatch) => void;
};

export default function SortableBlock({
  block,
  isSelected,
  onDelete,
  onDuplicate,
  onPickImage,
  onSelect,
  onUpdate,
}: SortableBlockProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const style = {
    opacity: isDragging ? 0.55 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`group relative rounded-lg border bg-transparent transition-colors ${
        isSelected
          ? "border-primary-400 ring-2 ring-primary-100"
          : "border-transparent hover:border-primary-200"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={`absolute -left-7 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-grab items-center justify-center rounded-md text-gray-300 transition-opacity hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
        title="Drag block"
      >
        <DotsNineIcon size={17} />
      </button>

      <div className="p-0">
        {block.type === "text" ? (
          <div
            onFocusCapture={onSelect}
            onClick={(event) => event.stopPropagation()}
          >
            <RichInput
              value={block.content}
              onChange={(content) => onUpdate({ content })}
              placeholder="Write your email text..."
              placeholderClassName="px-3 py-2 text-sm text-gray-300"
              containerClassName="w-full"
              className="min-h-24 w-full rounded-md border-0 bg-transparent px-3 py-2 text-[15px] leading-relaxed text-inherit outline-none transition-colors whitespace-pre-wrap"
              stopPropagation
              allowDateUtilities={false}
            />
          </div>
        ) : null}

        {block.type === "image" ? (
          <div onPointerDownCapture={onSelect}>
            <EmailResizableImage
              block={block}
              isSelected={isSelected}
              onPickImage={onPickImage}
              onUpdate={onUpdate}
            />
          </div>
        ) : null}

        {block.type === "spacer" ? (
          <div
            className="rounded-md border border-dashed border-gray-300 bg-gray-50"
            style={{
              height: block.height,
              backgroundImage:
                "repeating-linear-gradient(45deg,#e5e7eb 0,#e5e7eb 1px,transparent 1px,transparent 8px)",
            }}
          />
        ) : null}
      </div>

      <div
        className={`absolute right-0 top-1/2 z-50 flex -translate-y-1/2 translate-x-[calc(100%+36px)] flex-col gap-1 transition-opacity ${
          isSelected
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-700"
          title="Duplicate"
        >
          <CopySimpleIcon size={13} />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:border-red-200 hover:text-red-500"
          title="Delete"
        >
          <TrashSimpleIcon size={13} />
        </button>
      </div>
    </div>
  );
}
