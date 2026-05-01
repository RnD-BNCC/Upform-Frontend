import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { ArrowsLeftRightIcon, XIcon } from "@phosphor-icons/react";

type ThemeImagePositionModalProps = {
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

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function ThemeImagePositionModal({
  imageUrl,
  isOpen,
  onClose,
  onSave,
  value,
}: ThemeImagePositionModalProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [draft, setDraft] = useState(value);

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
              <ArrowsLeftRightIcon size={15} />
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
            <div
              className="pointer-events-none absolute inset-y-0 w-[105px] border-x border-dashed border-white bg-cover"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundPosition: `${draft.x}% ${draft.y}%`,
                left: `${draft.x}%`,
                transform: "translateX(-50%)",
              }}
            />
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
