import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { SCALE_COLORS } from "@/config/polling";

type Props = {
  statements: string[];
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  colors?: string[];
};

export default function ScaleInput({
  statements,
  onSubmit,
  isPending,
  min = 1,
  max = 10,
  minLabel,
  maxLabel,
  colors,
}: Props) {
  const mid = Math.round((min + max) / 2);
  const [values, setValues] = useState<Record<number, number>>(() =>
    Object.fromEntries(statements.map((_, index) => [index, mid])),
  );
  const [skipped, setSkipped] = useState<Set<number>>(new Set());

  const effectiveStatements = statements.length > 0 ? statements : ["Rating"];

  const handleSubmit = () => {
    onSubmit({
      scales: effectiveStatements.map((statement, index) => ({
        statement,
        value: skipped.has(index) ? null : (values[index] ?? mid),
      })),
    });
  };

  const allSkipped = effectiveStatements.every((_, index) =>
    skipped.has(index),
  );

  return (
    <div className="flex flex-col gap-8">
      {effectiveStatements.map((statement, index) => {
        const isSkipped = skipped.has(index);
        const currentValue = values[index] ?? mid;
        const percentage = ((currentValue - min) / (max - min)) * 100;
        const color = colors?.[index] || SCALE_COLORS[index % SCALE_COLORS.length];

        return (
          <div
            key={index}
            className={`transition-opacity ${isSkipped ? "opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-lg text-gray-900">
                {statement || `Statement ${index + 1}`}
              </h3>
              <button
                onClick={() => {
                  const next = new Set(skipped);
                  if (isSkipped) next.delete(index);
                  else next.add(index);
                  setSkipped(next);
                }}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer shrink-0 ml-3"
              >
                {isSkipped ? "Undo" : "Skip"}
              </button>
            </div>

            {isSkipped ? (
              <div className="text-sm text-gray-400 italic py-6 text-center">
                Skipped
              </div>
            ) : (
              <div className="pt-1">
                <p className="text-gray-700 text-sm mb-3">{currentValue}</p>
                <div className="relative py-3">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-200" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-1 rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-4 border-white shadow-md"
                    style={{
                      left: `${percentage}%`,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: color,
                    }}
                  />
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={currentValue}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [index]: Number(event.target.value),
                      }))
                    }
                    className="relative w-full h-7 appearance-none bg-transparent cursor-pointer z-10 opacity-0"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">{min}</span>
                  <span className="text-xs text-gray-400">{max}</span>
                </div>
                <div className="flex justify-between -mt-0.5">
                  <span className="text-[11px] text-gray-400 italic">
                    {minLabel || "Strongly disagree"}
                  </span>
                  <span className="text-[11px] text-gray-400 italic">
                    {maxLabel || "Strongly agree"}
                  </span>
                </div>
              </div>
            )}

            {index < effectiveStatements.length - 1 && (
              <div className="border-b border-gray-100 mt-4" />
            )}
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        disabled={allSkipped || isPending}
        className="w-full bg-primary-500 text-white font-bold py-3.5 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}
