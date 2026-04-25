import { Presentation, SpinnerGap } from "@phosphor-icons/react";

type Props = {
  name: string;
  questionNumber?: number;
  totalQuestions?: number;
};

export default function WaitingScreen({
  name,
  questionNumber,
  totalQuestions,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
        <Presentation size={36} className="text-primary-500" weight="bold" />
      </div>
      <div>
        {questionNumber !== undefined && totalQuestions ? (
          <>
            <p className="text-xs font-semibold text-primary-500 mb-1">
              Question {questionNumber} of {totalQuestions}
            </p>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Get ready!</h2>
          </>
        ) : (
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Wait for the host to start the quiz.
          </h2>
        )}
        <p className="text-sm text-gray-400">
          Hi <span className="font-semibold text-gray-600">{name}</span>!
        </p>
      </div>
      <SpinnerGap size={24} className="text-primary-400 animate-spin mt-2" />
      <p className="text-xs text-gray-300 mt-2 max-w-xs">
        Please reload your browser or contact us at{" "}
        <span className="font-semibold text-gray-400">contact@bncc.net</span> if
        the quiz won't load.
      </p>
    </div>
  );
}
