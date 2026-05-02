import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowsDownUpIcon,
  ArrowsLeftRightIcon,
  ArrowsOutCardinalIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { ThemeFormPosition } from "@/utils/form/themeConfig";

type ThemeImagePositionModalProps = {
  formPosition: ThemeFormPosition;
  imageUrl: string | null;
  isOpen: boolean;
  value: {
    x: number;
    y: number;
  };
  onClose: () => void;
  onSave: (value: { x: number; y: number }) => void;
};

type DragState = {
  height: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  width: number;
};

type PositionFrameMode = "full" | "horizontal" | "vertical";

const HORIZONTAL_FRAME_HEIGHT = 118;
const VERTICAL_FRAME_WIDTH = 120;

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getPositionFrameMode(formPosition: ThemeFormPosition): PositionFrameMode {
  if (formPosition === "image-top" || formPosition === "image-bottom") {
    return "horizontal";
  }

  if (formPosition === "image-background") {
    return "full";
  }

  return "vertical";
}

function getPositionDraft(
  value: { x: number; y: number },
  frameMode: PositionFrameMode,
) {
  if (frameMode === "horizontal") {
    return {
      x: 50,
      y: clampPosition(value.y),
    };
  }

  if (frameMode === "vertical") {
    return {
      x: clampPosition(value.x),
      y: 50,
    };
  }

  return {
    x: clampPosition(value.x),
    y: clampPosition(value.y),
  };
}

export default function ThemeImagePositionModal({
  formPosition,
  imageUrl,
  isOpen,
  onClose,
  onSave,
  value,
}: ThemeImagePositionModalProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameMode = getPositionFrameMode(formPosition);
  const [draft, setDraft] = useState(() => getPositionDraft(value, frameMode));
  const PositionIcon =
    frameMode === "horizontal"
      ? ArrowsDownUpIcon
      : frameMode === "full"
        ? ArrowsOutCardinalIcon
        : ArrowsLeftRightIcon;

  useEffect(() => {
    if (isOpen) {
      setDraft(getPositionDraft(value, frameMode));
    }
  }, [frameMode, isOpen, value.x, value.y]);

  if (!isOpen || !imageUrl) return null;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      height: rect.height,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: draft.x,
      startY: draft.y,
      width: rect.width,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (frameMode === "horizontal") {
      const movableHeight = Math.max(
        1,
        dragState.height - HORIZONTAL_FRAME_HEIGHT,
      );
      const nextY =
        dragState.startY +
        ((event.clientY - dragState.startClientY) / movableHeight) * 100;

      setDraft({
        x: 50,
        y: clampPosition(nextY),
      });
      return;
    }

    if (frameMode === "vertical") {
      const movableWidth = Math.max(1, dragState.width - VERTICAL_FRAME_WIDTH);
      const nextX =
        dragState.startX +
        ((event.clientX - dragState.startClientX) / movableWidth) * 100;

      setDraft({
        x: clampPosition(nextX),
        y: 50,
      });
      return;
    }

    const nextX =
      dragState.startX +
      ((event.clientX - dragState.startClientX) / dragState.width) * 100;
    const nextY =
      dragState.startY +
      ((event.clientY - dragState.startClientY) / dragState.height) * 100;

    setDraft({
      x: clampPosition(nextX),
      y: clampPosition(nextY),
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[578px] overflow-hidden rounded-sm border border-gray-200 bg-white text-gray-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-[58px] items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <PositionIcon size={15} />
            </span>
            <h2 className="text-base font-bold">Change image position</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close position modal"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-xs font-medium text-gray-500">
            Drag to reposition image
          </p>
          <div
            ref={previewRef}
            role="presentation"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative h-[405px] w-full cursor-grab overflow-hidden rounded-none bg-cover active:cursor-grabbing"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: `${draft.x}% ${draft.y}%`,
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-black/45" />
            {frameMode === "vertical" ? (
              <div
                className="pointer-events-none absolute inset-y-0 w-[120px] bg-cover"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: `${draft.x}% ${draft.y}%`,
                  left: `calc(${draft.x}% - ${
                    (VERTICAL_FRAME_WIDTH * draft.x) / 100
                  }px)`,
                }}
              />
            ) : null}
            {frameMode === "horizontal" ? (
              <div
                className="pointer-events-none absolute inset-x-0 h-[118px] bg-cover"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: `${draft.x}% ${draft.y}%`,
                  top: `calc(${draft.y}% - ${
                    (HORIZONTAL_FRAME_HEIGHT * draft.y) / 100
                  }px)`,
                }}
              />
            ) : null}
            {frameMode === "full" ? (
              <div
                className="pointer-events-none absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: `${draft.x}% ${draft.y}%`,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="h-8 rounded-sm bg-gray-900 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
