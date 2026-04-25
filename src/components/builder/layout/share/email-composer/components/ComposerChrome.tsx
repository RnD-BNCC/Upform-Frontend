import { motion } from "framer-motion";
import { CheckIcon, WarningIcon } from "@phosphor-icons/react";
import type { EmailComposerScreen } from "@/types/builderShare";

export function EmailStepIndicator({
  screen,
}: {
  screen: EmailComposerScreen;
}) {
  const isRecipients = screen === "recipients";

  return (
    <div className="ml-auto flex items-center gap-3">
      <span className="text-base font-semibold text-gray-900">
        {isRecipients ? "Set recipients" : "Set layout"}
      </span>
      <div className="flex items-center">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            isRecipients
              ? "border-primary-500 bg-primary-500 text-white"
              : "border-primary-500 bg-white"
          }`}
        >
          {isRecipients ? (
            <CheckIcon size={12} weight="bold" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
          )}
        </span>
        <span
          className={`h-0.5 w-10 ${
            isRecipients ? "bg-primary-500" : "bg-gray-300"
          }`}
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            isRecipients
              ? "border-primary-500 bg-white"
              : "border-gray-300 bg-white"
          }`}
        >
          {isRecipients ? (
            <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function LeaveWithoutSendingModal({
  onExit,
  onResume,
}: {
  onExit: () => void;
  onResume: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-80 flex items-center justify-center bg-black/45 px-4"
      onClick={onResume}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.14 }}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500">
          <WarningIcon size={18} weight="fill" />
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-950">
          Leave without sending?
        </h3>
        <p className="mx-auto mt-2 max-w-64 text-sm font-medium leading-relaxed text-gray-500">
          If you leave now, you will lose your unsaved email draft.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onResume}
            className="h-10 rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onExit}
            className="h-10 rounded-md bg-red-500 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-600"
          >
            Exit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
