import { useState, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDownIcon, StarIcon, HeartIcon, ThumbsUpIcon } from "@phosphor-icons/react";
import type { FormField } from "@/types/form";

const RATING_ICONS = [
  { value: "star" as const, Icon: StarIcon, label: "Star", color: "text-yellow-400" },
  { value: "heart" as const, Icon: HeartIcon, label: "Heart", color: "text-red-400" },
  { value: "thumb" as const, Icon: ThumbsUpIcon, label: "Thumb", color: "text-primary-500" },
] as const;

type Props = {
  scaleMax?: number;
  ratingIcon?: "star" | "heart" | "thumb";
  minLabel?: string;
  maxLabel?: string;
  isSelected: boolean;
  onChange: (updates: Partial<FormField>) => void;
};

export const RatingSection = memo(function RatingSection({
  scaleMax,
  ratingIcon,
  minLabel,
  maxLabel,
  isSelected,
  onChange,
}: Props) {
  const [countOpen, setCountOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const activeKey = ratingIcon ?? "star";
  const count = scaleMax ?? 5;
  const { Icon: ActiveIcon, color: activeColor } = RATING_ICONS.find((r) => r.value === activeKey)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countRef.current && !countRef.current.contains(e.target as Node)) setCountOpen(false);
      if (iconRef.current && !iconRef.current.contains(e.target as Node)) setIconOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-4">
        <div ref={countRef} className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setCountOpen((v) => !v); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-sm bg-white transition-colors"
          >
            <span className="text-gray-700">{count}</span>
            <CaretDownIcon size={12} className={`text-gray-400 transition-transform duration-150 ${countOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {countOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden min-w-[60px]"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={(e) => { e.stopPropagation(); onChange({ scaleMax: n }); setCountOpen(false); }}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      count === n ? "text-primary-600 bg-primary-50 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={iconRef} className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIconOpen((v) => !v); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-sm bg-white transition-colors"
          >
            <ActiveIcon size={16} weight="fill" className={activeColor} />
            <CaretDownIcon size={12} className={`text-gray-400 transition-transform duration-150 ${iconOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {iconOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden min-w-[120px]"
              >
                {RATING_ICONS.map(({ value, Icon, label, color }) => (
                  <button
                    key={value}
                    onClick={(e) => { e.stopPropagation(); onChange({ ratingIcon: value }); setIconOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                      activeKey === value ? "text-primary-600 bg-primary-50 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} weight="fill" className={color} />
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
          <div key={n} className="flex flex-col items-center gap-2 w-14 shrink-0">
            <span className="text-base text-gray-500">{n}</span>
            <ActiveIcon size={32} className="text-gray-300" />
          </div>
        ))}
      </div>

      {isSelected && (
        <div className="flex gap-4 mt-3">
          <input
            value={minLabel ?? ""}
            onChange={(e) => onChange({ minLabel: e.target.value || undefined })}
            placeholder="Label (min)"
            onClick={(e) => e.stopPropagation()}
            className="text-sm border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none pb-0.5 flex-1 transition-colors"
          />
          <input
            value={maxLabel ?? ""}
            onChange={(e) => onChange({ maxLabel: e.target.value || undefined })}
            placeholder="Label (max)"
            onClick={(e) => e.stopPropagation()}
            className="text-sm border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none pb-0.5 flex-1 text-right transition-colors"
          />
        </div>
      )}
    </div>
  );
});
