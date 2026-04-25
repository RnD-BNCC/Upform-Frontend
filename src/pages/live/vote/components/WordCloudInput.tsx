import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";

type Props = {
  onSubmit: (value: unknown) => void;
  isPending: boolean;
};

export default function WordCloudInput({ onSubmit, isPending }: Props) {
  const [word, setWord] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <input
        value={word}
        onChange={(event) => setWord(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && word.trim() && !isPending) {
            onSubmit({ word: word.trim() });
            setWord("");
          }
        }}
        placeholder="Type a word..."
        className="text-lg border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-center font-semibold"
        autoFocus
      />
      <button
        onClick={() => {
          if (word.trim()) {
            onSubmit({ word: word.trim() });
            setWord("");
          }
        }}
        disabled={!word.trim() || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
