import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { SuccessIcon } from "@/components/icons";

type Props = {
  scoreFeedback?: { points: number; isCorrect: boolean } | null;
  hasCorrectAnswer?: boolean;
};

export default function ThankYouScreen({
  scoreFeedback,
  hasCorrectAnswer = true,
}: Props) {
  if (scoreFeedback && hasCorrectAnswer) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        {scoreFeedback.isCorrect ? (
          <>
            <CheckCircle size={48} className="text-emerald-500" weight="fill" />
            <h2 className="text-lg font-bold text-gray-900">Correct!</h2>
            <p className="text-2xl font-black text-emerald-500">
              +{scoreFeedback.points}
            </p>
          </>
        ) : (
          <>
            <XCircle size={48} className="text-red-400" weight="fill" />
            <h2 className="text-lg font-bold text-gray-900">Incorrect</h2>
            <p className="text-sm text-gray-400">Better luck next time!</p>
          </>
        )}
        <p className="text-xs text-gray-300 mt-2">
          Waiting for next question...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="relative flex size-12">
        <span className="absolute animate-ping bg-emerald-500 rounded-full h-full w-full opacity-50" />
        <div className="relative">
          <SuccessIcon size={48} />
        </div>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Vote Recorded!</h2>
      <p className="text-sm text-gray-400">Waiting for next question...</p>
    </div>
  );
}
