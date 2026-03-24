import type { SlideType, SlideResults, SlideSettings } from '@/types/polling'
import WordCloudViz from './WordCloudViz'
import MCBarChart from './MCBarChart'
import OpenEndedFeed from './OpenEndedFeed'
import RankingViz from './RankingViz'
import ScaleViz from './ScaleViz'
import QAFeed from './QAFeed'
import GuessNumberViz from './GuessNumberViz'
import HundredPointsViz from './HundredPointsViz'
import PinOnImageViz from './PinOnImageViz'
import Grid2x2Viz from './Grid2x2Viz'

export default function SlideVisualization({
  type,
  results,
  textColor = '#111827',
  bgColor = '#FFFFFF',
  correctAnswer,
  correctNumber,
  highlightedVoteId,
  settings,
  revealCorrectAnswer,
  onQANext,
  onQAPrev,
  onMarkQAAnswered,
}: {
  type: SlideType
  results: SlideResults | null
  textColor?: string
  bgColor?: string
  correctAnswer?: string
  correctNumber?: number
  highlightedVoteId?: string | null
  settings?: SlideSettings
  revealCorrectAnswer?: string
  onQANext?: () => void
  onQAPrev?: () => void
  onMarkQAAnswered?: (voteId: string) => void
}) {
  if (!results) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for responses...
      </div>
    )
  }

  switch (type) {
    case 'word_cloud':
      return <WordCloudViz data={results as Parameters<typeof WordCloudViz>[0]['data']} />
    case 'multiple_choice':
      return <MCBarChart data={results as Parameters<typeof MCBarChart>[0]['data']} textColor={textColor} settings={settings} revealCorrectAnswer={revealCorrectAnswer} />
    case 'open_ended':
      return <OpenEndedFeed data={results as Parameters<typeof OpenEndedFeed>[0]['data']} textColor={textColor} />
    case 'ranking':
      return <RankingViz data={results as Parameters<typeof RankingViz>[0]['data']} textColor={textColor} />
    case 'scales':
      return <ScaleViz data={results as Parameters<typeof ScaleViz>[0]['data']} textColor={textColor} settings={settings} />
    case 'qa':
      return <QAFeed data={results as Parameters<typeof QAFeed>[0]['data']} textColor={textColor} highlightedVoteId={highlightedVoteId} onNext={onQANext} onPrev={onQAPrev} onMarkAnswered={onMarkQAAnswered} />
    case 'guess_number':
      return <GuessNumberViz data={results as Parameters<typeof GuessNumberViz>[0]['data']} textColor={textColor} correctNumber={correctNumber} />
    case 'hundred_points':
      return <HundredPointsViz data={results as Parameters<typeof HundredPointsViz>[0]['data']} textColor={textColor} />
    case 'pin_on_image':
      return <PinOnImageViz data={results as Parameters<typeof PinOnImageViz>[0]['data']} settings={settings} textColor={textColor} />
    case 'grid_2x2':
      return <Grid2x2Viz data={results as Parameters<typeof Grid2x2Viz>[0]['data']} settings={settings} textColor={textColor} />
    default:
      return null
  }
}
