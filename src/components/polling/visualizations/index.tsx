import type { SlideType, SlideResults, SlideSettings } from "@/types/polling";
import WordCloudViz from "@/components/polling/visualizations/WordCloudViz";
import MCBarChart from "@/components/polling/visualizations/MCBarChart";
import ScaleViz from "@/components/polling/visualizations/ScaleViz";
import QAFeed from "@/components/polling/visualizations/QAFeed";
import GuessNumberViz from "@/components/polling/visualizations/GuessNumberViz";
import PinOnImageViz from "@/components/polling/visualizations/PinOnImageViz";

export { default as QAFeed } from "@/components/polling/visualizations/QAFeed";
export { default as WordCloudViz } from "@/components/polling/visualizations/WordCloudViz";
export { default as MCBarChart } from "@/components/polling/visualizations/MCBarChart";
export { default as ScaleViz } from "@/components/polling/visualizations/ScaleViz";
export { default as GuessNumberViz } from "@/components/polling/visualizations/GuessNumberViz";
export { default as PinOnImageViz } from "@/components/polling/visualizations/PinOnImageViz";

export default function SlideVisualization({
  type,
  results,
  textColor = "#111827",
  bgColor: _bgColor = "#FFFFFF",
  correctAnswer: _correctAnswer,
  correctNumber,
  highlightedVoteId,
  settings,
  revealCorrectAnswer,
  revealPhase,
  onQANext,
  onQAPrev,
  onMarkQAAnswered,
}: {
  type: SlideType;
  results: SlideResults | null;
  textColor?: string;
  bgColor?: string;
  correctAnswer?: string;
  correctNumber?: number;
  highlightedVoteId?: string | null;
  settings?: SlideSettings;
  revealCorrectAnswer?: string;
  revealPhase?: boolean;
  onQANext?: () => void;
  onQAPrev?: () => void;
  onMarkQAAnswered?: (voteId: string) => void;
}) {
  if (!results) {
    return (
      <div
        className="flex items-center justify-center h-full text-lg"
        style={{ color: textColor, opacity: 0.4 }}
      >
        Waiting for responses...
      </div>
    );
  }

  switch (type) {
    case "word_cloud":
      return (
        <WordCloudViz
          data={results as Parameters<typeof WordCloudViz>[0]["data"]}
          correctAnswers={revealPhase ? settings?.correctAnswers : undefined}
        />
      );
    case "multiple_choice":
      return (
        <MCBarChart
          data={results as Parameters<typeof MCBarChart>[0]["data"]}
          textColor={textColor}
          settings={settings}
          revealCorrectAnswer={revealCorrectAnswer}
        />
      );
    case "scales":
      return (
        <ScaleViz
          data={results as Parameters<typeof ScaleViz>[0]["data"]}
          textColor={textColor}
          settings={settings}
        />
      );
    case "qa":
      return (
        <QAFeed
          data={results as Parameters<typeof QAFeed>[0]["data"]}
          textColor={textColor}
          highlightedVoteId={highlightedVoteId}
          onNext={onQANext}
          onPrev={onQAPrev}
          onMarkAnswered={onMarkQAAnswered}
        />
      );
    case "guess_number":
      return (
        <GuessNumberViz
          data={results as Parameters<typeof GuessNumberViz>[0]["data"]}
          textColor={textColor}
          correctNumber={correctNumber}
          settings={settings}
          showCorrectAnswer={revealPhase}
        />
      );
    case "pin_on_image":
      return (
        <PinOnImageViz
          data={results as Parameters<typeof PinOnImageViz>[0]["data"]}
          settings={settings}
          textColor={textColor}
          revealPhase={revealPhase}
        />
      );
    default:
      return null;
  }
}
