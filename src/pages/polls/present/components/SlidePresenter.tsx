import SlideVisualization from "@/components/polling/visualizations";
import type { SlideType, PollSlide, ImageLayout, SlideResults, SlideSettings } from "@/types/polling";

type SlidePresenterProps = {
  activeSlide: PollSlide
  imageUrl: string | undefined
  imageLayout: ImageLayout
  hideResponses: boolean
  textColor: string
  bgColor: string
  effectiveResults: SlideResults | null
  slideSettings: SlideSettings
  qaHighlightedVoteId: string | null
  revealPhase: boolean
  onQANext: () => void
  onQAPrev: () => void
  onMarkQAAnswered: (voteId: string) => Promise<void>
}

export default function SlidePresenter({
  activeSlide,
  imageUrl,
  imageLayout,
  hideResponses,
  textColor,
  bgColor,
  effectiveResults,
  slideSettings,
  qaHighlightedVoteId,
  revealPhase,
  onQANext,
  onQAPrev,
  onMarkQAAnswered,
}: SlidePresenterProps) {
  const isSideLayout = imageUrl &&
    ["left", "right", "left-large", "right-large"].includes(imageLayout);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20 relative">
      <div className="relative z-[1] w-full max-w-4xl flex-1 flex flex-col items-center justify-center">
        {imageUrl && imageLayout === "above" && (
          <div className="flex justify-center mb-6">
            <div className="max-h-56 max-w-full overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {isSideLayout ? (
          <div
            className={`flex gap-8 w-full flex-1 items-center ${
              imageLayout === "right" || imageLayout === "right-large"
                ? "flex-row-reverse"
                : ""
            }`}
          >
            <div
              className={`${
                imageLayout.includes("large") ? "w-3/5" : "w-2/5"
              } shrink-0 flex items-center`}
            >
              <div className="w-full max-h-80 overflow-hidden rounded-xl">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="text-center mb-8 w-full">
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: textColor }}
                  dangerouslySetInnerHTML={{
                    __html: activeSlide.question || "No question",
                  }}
                />
              </div>
              {!hideResponses && (
                <div className="w-full flex-1 flex items-center justify-center relative">
                  <SlideVisualization
                    type={activeSlide.type as SlideType}
                    results={effectiveResults}
                    textColor={textColor}
                    bgColor={bgColor}
                    correctNumber={slideSettings.correctNumber}
                    highlightedVoteId={qaHighlightedVoteId}
                    settings={slideSettings}
                    revealCorrectAnswer={
                      revealPhase ? slideSettings.correctAnswer : undefined
                    }
                    revealPhase={revealPhase}
                    onQANext={onQANext}
                    onQAPrev={onQAPrev}
                    onMarkQAAnswered={onMarkQAAnswered}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-4 w-full">
              <h2
                className="text-3xl sm:text-4xl font-bold"
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{
                  __html: activeSlide.question || "No question",
                }}
              />
            </div>
            <p
              className="text-sm font-medium opacity-40 mb-6"
              style={{ color: textColor }}
            >
              Look at your device
            </p>
            {!hideResponses ? (
              <div className="w-full max-w-4xl flex-1 flex items-center justify-center relative">
                <SlideVisualization
                  type={activeSlide.type as SlideType}
                  results={effectiveResults}
                  textColor={textColor}
                  bgColor={bgColor}
                  correctNumber={slideSettings.correctNumber}
                  highlightedVoteId={qaHighlightedVoteId}
                  settings={slideSettings}
                  revealCorrectAnswer={
                    revealPhase ? slideSettings.correctAnswer : undefined
                  }
                  revealPhase={revealPhase}
                  onQANext={onQANext}
                  onQAPrev={onQAPrev}
                  onMarkQAAnswered={onMarkQAAnswered}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p
                  className="text-lg font-medium opacity-30"
                  style={{ color: textColor }}
                >
                  Responses hidden
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
