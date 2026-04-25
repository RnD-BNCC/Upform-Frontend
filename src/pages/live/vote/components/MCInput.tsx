import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";

type Props = {
  options: string[];
  onSubmit: (value: unknown) => void;
  isPending: boolean;
};

export default function MCInput({ options, onSubmit, isPending }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => setSelected(option)}
          className={`text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ${
            selected === option
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}
        >
          {option}
        </button>
      ))}
      <button
        onClick={() => selected && onSubmit({ option: selected })}
        disabled={!selected || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 mt-2 cursor-pointer disabled:cursor-not-allowed"
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
