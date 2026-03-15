import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { FormField } from "@/types/form";

type Props = {
  scaleMin?: number;
  scaleMax?: number;
  minLabel?: string;
  maxLabel?: string;
  onChange: (updates: Partial<FormField>) => void;
};

export const LinearScaleField = memo(function LinearScaleField({
  scaleMin,
  scaleMax,
  minLabel,
  maxLabel,
  onChange,
}: Props) {
  const [minOpen, setMinOpen] = useState(false);
  const [maxOpen, setMaxOpen] = useState(false);
  const [minUp, setMinUp] = useState(false);
  const [maxUp, setMaxUp] = useState(false);
  const [minMaxHeight, setMinMaxHeight] = useState(300);
  const [maxMaxHeight, setMaxMaxHeight] = useState(300);

  const minRef = useRef<HTMLDivElement>(null);
  const maxRef = useRef<HTMLDivElement>(null);
  const minBtnRef = useRef<HTMLButtonElement>(null);
  const maxBtnRef = useRef<HTMLButtonElement>(null);

  const start = scaleMin ?? 1;
  const end = scaleMax ?? 5;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (minRef.current && !minRef.current.contains(e.target as Node)) setMinOpen(false);
      if (maxRef.current && !maxRef.current.contains(e.target as Node)) setMaxOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMinOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMinOpen((prev) => {
      if (!prev) {
        const rect = minBtnRef.current?.getBoundingClientRect();
        if (rect) {
          const mobileToolbar = window.innerWidth < 640 ? 56 : 0;
          const spaceBelow = window.innerHeight - rect.bottom - mobileToolbar;
          const spaceAbove = rect.top - 72;
          const isUp = spaceBelow < 160;
          setMinUp(isUp);
          setMinMaxHeight(Math.max(120, isUp ? spaceAbove - 8 : spaceBelow - 8));
        }
      }
      return !prev;
    });
  }, []);

  const handleMaxOpen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMaxOpen((prev) => {
      if (!prev) {
        const rect = maxBtnRef.current?.getBoundingClientRect();
        if (rect) {
          const mobileToolbar = window.innerWidth < 640 ? 56 : 0;
          const spaceBelow = window.innerHeight - rect.bottom - mobileToolbar;
          const spaceAbove = rect.top - 72;
          const isUp = spaceBelow < 300;
          setMaxUp(isUp);
          setMaxMaxHeight(Math.max(120, isUp ? spaceAbove - 8 : spaceBelow - 8));
        }
      }
      return !prev;
    });
  }, []);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2">
        <div ref={minRef} className="relative">
          <button
            ref={minBtnRef}
            onClick={handleMinOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-sm bg-white transition-colors"
          >
            <span className="text-gray-900">{start}</span>
            <CaretDownIcon size={12} className={`text-gray-500 transition-transform duration-150 ${minOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {minOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: minUp ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: minUp ? 4 : -4 }}
                transition={{ duration: 0.1 }}
                className={`absolute ${minUp ? "bottom-full mb-1" : "top-full mt-1"} left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-y-auto min-w-15`}
                style={{ maxBlockSize: minMaxHeight }}
              >
                {[0, 1].map((n) => (
                  <button
                    key={n}
                    onClick={(e) => { e.stopPropagation(); onChange({ scaleMin: n }); setMinOpen(false); }}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      start === n ? "text-primary-600 bg-primary-50 font-medium" : "text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="text-sm text-gray-900">to</span>

        <div ref={maxRef} className="relative">
          <button
            ref={maxBtnRef}
            onClick={handleMaxOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-sm bg-white transition-colors"
          >
            <span className="text-gray-900">{end}</span>
            <CaretDownIcon size={12} className={`text-gray-500 transition-transform duration-150 ${maxOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {maxOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: maxUp ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: maxUp ? 4 : -4 }}
                transition={{ duration: 0.1 }}
                className={`absolute ${maxUp ? "bottom-full mb-1" : "top-full mt-1"} left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-y-auto min-w-15`}
                style={{ maxBlockSize: maxMaxHeight }}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={(e) => { e.stopPropagation(); onChange({ scaleMax: n }); setMaxOpen(false); }}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      end === n ? "text-primary-600 bg-primary-50 font-medium" : "text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-base text-gray-900 w-5 shrink-0">{start}</span>
          <input
            value={minLabel ?? ""}
            onChange={(e) => onChange({ minLabel: e.target.value || undefined })}
            placeholder="Label (optional)"
            onClick={(e) => e.stopPropagation()}
            className="text-base text-gray-900 border-b border-gray-300 hover:border-gray-400 focus:border-primary-500 outline-none pb-0.5 w-48 transition-colors placeholder:text-gray-400 bg-transparent"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base text-gray-900 w-5 shrink-0">{end}</span>
          <input
            value={maxLabel ?? ""}
            onChange={(e) => onChange({ maxLabel: e.target.value || undefined })}
            placeholder="Label (optional)"
            onClick={(e) => e.stopPropagation()}
            className="text-base text-gray-900 border-b border-gray-300 hover:border-gray-400 focus:border-primary-500 outline-none pb-0.5 w-48 transition-colors placeholder:text-gray-400 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
});
