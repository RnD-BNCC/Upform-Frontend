import { useEffect, useRef, useState } from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

type RefreshButtonProps = {
  ariaLabel: string;
  className?: string;
  iconSize?: number;
  iconWeight?: "bold" | "duotone" | "fill" | "light" | "regular" | "thin";
  onRefresh: () => void | Promise<void>;
};

const MIN_SPIN_MS = 650;

export default function RefreshButton({
  ariaLabel,
  className = "",
  iconSize = 16,
  iconWeight = "regular",
  onRefresh,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const stopRefreshing = (startedAt: number) => {
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(MIN_SPIN_MS - elapsed, 0);

    timeoutRef.current = window.setTimeout(() => {
      setIsRefreshing(false);
      timeoutRef.current = null;
    }, remaining);
  };

  return (
    <button
      type="button"
      onClick={() => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        const startedAt = Date.now();
        setIsRefreshing(true);

        Promise.resolve(onRefresh()).finally(() => stopRefreshing(startedAt));
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-default ${className}`}
      aria-label={ariaLabel}
      disabled={isRefreshing}
    >
      <ArrowsClockwiseIcon
        size={iconSize}
        weight={iconWeight}
        className={isRefreshing ? "animate-spin" : undefined}
      />
    </button>
  );
}
