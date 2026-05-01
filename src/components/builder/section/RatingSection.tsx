import { memo, useState } from "react";
import { StarIcon, StarHalfIcon, HeartIcon, ThumbsUpIcon } from "@phosphor-icons/react";

const RATING_ICONS = [
  { value: "star"  as const, Icon: StarIcon,     color: "text-yellow-400" },
  { value: "heart" as const, Icon: HeartIcon,    color: "text-red-400"    },
  { value: "thumb" as const, Icon: ThumbsUpIcon, color: "text-primary-500" },
] as const;

type Props = {
  scaleMax?: number;
  ratingIcon?: "star" | "heart" | "thumb";
  minLabel?: string;
  maxLabel?: string;
  defaultValue?: string;
  allowHalfStar?: boolean;
  onChange?: (value: string) => void;
};

export const RatingSection = memo(function RatingSection({
  scaleMax,
  ratingIcon,
  minLabel,
  maxLabel,
  defaultValue,
  allowHalfStar,
  onChange,
}: Props) {
  const activeKey = ratingIcon ?? "star";
  const count = scaleMax ?? 5;
  const active = defaultValue ? Number(defaultValue) : 0;
  const [hover, setHover] = useState<number>(0);
  const { Icon: ActiveIcon, color: activeColor } = RATING_ICONS.find((r) => r.value === activeKey)!;
  const inactiveIconStyle = {
    color: "var(--upform-theme-answer-border, #d1d5db)",
  } as const;

  const displayed = hover || active;

  if (allowHalfStar && activeKey === "star") {
    return (
      <div className="space-y-2 select-none">
        <div className="flex gap-1.5">
          {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
            const full = displayed >= n;
            const half = !full && displayed >= n - 0.5;
            return (
              <div
                key={n}
                className={`relative w-6 h-6 ${onChange ? 'cursor-pointer' : ''}`}
                onMouseLeave={() => setHover(0)}
              >
                {/* left half hover zone */}
                <div
                  className="absolute inset-y-0 left-0 w-1/2 z-10"
                  onMouseEnter={() => onChange && setHover(n - 0.5)}
                  onClick={() => onChange?.((n - 0.5).toString())}
                />
                {/* right half hover zone */}
                <div
                  className="absolute inset-y-0 right-0 w-1/2 z-10"
                  onMouseEnter={() => onChange && setHover(n)}
                  onClick={() => onChange?.(n.toString())}
                />
                {full ? (
                  <ActiveIcon size={24} weight="fill" className={activeColor} />
                ) : half ? (
                  <StarHalfIcon size={24} weight="fill" className={activeColor} />
                ) : (
                  <ActiveIcon
                    size={24}
                    weight="regular"
                    style={inactiveIconStyle}
                  />
                )}
              </div>
            );
          })}
        </div>
        {(minLabel || maxLabel) && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 select-none">
      <div className="flex gap-1.5">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
          <ActiveIcon
            key={n}
            size={24}
            weight={n <= active ? "fill" : "regular"}
            className={`${n <= active ? activeColor : ""} ${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            style={n <= active ? undefined : inactiveIconStyle}
            onClick={onChange ? (e) => { e.stopPropagation(); onChange(String(n)) } : undefined}
          />
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
});
