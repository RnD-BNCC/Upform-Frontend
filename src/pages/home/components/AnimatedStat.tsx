import { useEffect, useRef, useState } from "react";
import { formatCompactNumber } from "../utils";

function useAnimatedNumber(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;

      setDisplay(Math.round(target * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, target]);

  return display;
}

type Props = {
  value: number;
  label: string;
};

export default function AnimatedStat({ value, label }: Props) {
  const display = useAnimatedNumber(value);

  return (
    <div className="flex flex-col items-center justify-center flex-1 sm:flex-none sm:px-8 py-4 sm:py-5 gap-1 sm:gap-1.5">
      <span className="text-2xl sm:text-[2.25rem] font-black text-white leading-none tracking-tight tabular-nums">
        {formatCompactNumber(display)}
      </span>
      <span className="text-[10px] sm:text-[11px] text-white/50 font-semibold tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}
