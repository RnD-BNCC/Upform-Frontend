import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SpinnerGap } from "@phosphor-icons/react";

type Props = {
  onSubmit: (value: unknown) => void;
  isPending: boolean;
  participantName: string;
};

export default function QAInput({
  onSubmit,
  isPending,
  participantName,
}: Props) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), participantName });
    setText("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center text-sm font-semibold text-emerald-500"
          >
            Question submitted!
          </motion.div>
        )}
      </AnimatePresence>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ask a question..."
        rows={3}
        className="text-sm border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 resize-none"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isPending}
        className="bg-primary-500 text-white font-bold py-3 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <SpinnerGap size={16} className="animate-spin" /> Submitting...
          </span>
        ) : (
          "Ask"
        )}
      </button>
    </div>
  );
}
