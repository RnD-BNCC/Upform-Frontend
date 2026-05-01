import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
};

const TOOLTIP_WIDTH = 248;
const VIEWPORT_PADDING = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function HelpTooltip({ children }: Props) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({
    arrowLeft: TOOLTIP_WIDTH / 2,
    left: 0,
    placement: "bottom" as "bottom" | "top",
    top: 0,
  });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;

    const rect = trigger.getBoundingClientRect();
    const centeredLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const maxLeft = Math.max(
      VIEWPORT_PADDING,
      window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
    );
    const left = clamp(centeredLeft, VIEWPORT_PADDING, maxLeft);
    const hasBottomSpace = rect.bottom + 96 < window.innerHeight;
    const top = hasBottomSpace ? rect.bottom + 8 : Math.max(8, rect.top - 8);

    setPosition({
      arrowLeft: clamp(
        rect.left + rect.width / 2 - left,
        12,
        TOOLTIP_WIDTH - 12,
      ),
      left,
      placement: hasBottomSpace ? "bottom" : "top",
      top,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  const tooltip =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[10000]"
            style={{
              left: position.left,
              top: position.top,
              width: TOOLTIP_WIDTH,
              transform:
                position.placement === "top" ? "translateY(-100%)" : undefined,
            }}
          >
            <div className="relative rounded-sm bg-gray-900 px-3 py-2 text-[11px] leading-4 text-white shadow-xl">
              <span
                className={`absolute h-2 w-2 rotate-45 bg-gray-900 ${
                  position.placement === "top"
                    ? "bottom-0 translate-y-1/2"
                    : "top-0 -translate-y-1/2"
                }`}
                style={{ left: position.arrowLeft - 4 }}
              />
              {children}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-gray-400 text-[9px] font-bold leading-none text-white transition-colors hover:bg-gray-500"
        aria-label="Help"
        tabIndex={0}
        onBlur={() => setIsOpen(false)}
        onFocus={() => {
          updatePosition();
          setIsOpen(true);
        }}
        onMouseEnter={() => {
          updatePosition();
          setIsOpen(true);
        }}
        onMouseLeave={() => setIsOpen(false)}
      >
        ?
      </span>
      {tooltip}
    </>
  );
}
