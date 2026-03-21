import type { SlideType, SlideResults } from '@/types/polling'
import WordCloudViz from './WordCloudViz'
import MCBarChart from './MCBarChart'
import OpenEndedFeed from './OpenEndedFeed'
import RankingViz from './RankingViz'
import ScaleViz from './ScaleViz'

export default function SlideVisualization({
  type,
  results,
  textColor = '#111827',
  bgColor = '#FFFFFF',
  correctAnswer,
}: {
  type: SlideType
  results: SlideResults | null
  textColor?: string
  bgColor?: string
  correctAnswer?: string
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
      return <MCBarChart data={results as Parameters<typeof MCBarChart>[0]['data']} textColor={textColor} bgColor={bgColor} correctAnswer={correctAnswer} />
    case 'open_ended':
      return <OpenEndedFeed data={results as Parameters<typeof OpenEndedFeed>[0]['data']} textColor={textColor} />
    case 'ranking':
      return <RankingViz data={results as Parameters<typeof RankingViz>[0]['data']} textColor={textColor} />
    case 'scales':
      return <ScaleViz data={results as Parameters<typeof ScaleViz>[0]['data']} textColor={textColor} />
    default:
      return null
  }
}
