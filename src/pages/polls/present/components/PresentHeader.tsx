import { Users } from "@phosphor-icons/react";
import type { PresentHeaderProps } from "./types";

export default function PresentHeader({
  title,
  code,
  currentSlide,
  totalSlides,
  participantCount,
  joinUrl,
  textColor,
}: PresentHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 z-10 relative">
      <div className="flex items-center gap-3">
        <h1
          className="text-sm font-bold truncate max-w-48 opacity-60"
          style={{ color: textColor }}
        >
          {title || "Untitled Poll"}
        </h1>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full opacity-50"
          style={{
            color: textColor,
            backgroundColor:
              textColor === "#FFFFFF"
                ? "rgba(255,255,255,0.15)"
                : "rgba(0,0,0,0.06)",
          }}
        >
          {`${currentSlide + 1}/${totalSlides}`}
        </span>
        <div
          className="flex items-center gap-1 opacity-50"
          style={{ color: textColor }}
        >
          <Users size={13} weight="bold" />
          <span className="text-[11px] font-semibold tabular-nums">
            {participantCount}
          </span>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-3">
        <div className="flex items-center gap-1 text-[9px] font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
          <span className="text-[10px]">
            Join at{" "}
            <span className="font-semibold text-gray-700">{joinUrl}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-[10px]">use code</span>
          <span className="text-gray-900 font-bold tracking-wider text-[12px]">
            {code}
          </span>
        </div>
      </div>

      <span className="text-[11px] font-bold italic text-primary-500">
        UpForm
      </span>
    </div>
  );
}
