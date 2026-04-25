import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";

type Props = {
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  min: number;
  max: number;
};

export default function GuessNumberInput({
  onSubmit,
  isPending,
  min,
  max,
}: Props) {
  const mid = Math.round((min + max) / 2);
  const [value, setValue] = useState(mid);
  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 50;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-base font-medium text-gray-600">
        Your answer: <span className="font-black text-gray-900">{value}</span>
      </p>
      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-[0_0_0_10px_rgba(99,102,241,0.12)]
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_0_10px_rgba(99,102,241,0.12)]"
          style={{
            background: `linear-gradient(to right, #0054a5 0%, #0054a5 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs font-semibold text-gray-400">{min}</span>
          <span className="text-xs font-semibold text-gray-400">{max}</span>
        </div>
      </div>
      <button
        onClick={() => onSubmit({ value })}
        disabled={isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-full hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
