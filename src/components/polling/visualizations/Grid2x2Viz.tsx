import type { Grid2x2Result, SlideSettings } from '@/types/polling'

const DOT_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308']

export default function Grid2x2Viz({
  data,
  settings,
  textColor = '#111827',
}: {
  data: Grid2x2Result
  settings?: SlideSettings
  textColor?: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for responses...
      </div>
    )
  }

  const axisXLabel = settings?.axisXLabel || 'X Axis'
  const axisYLabel = settings?.axisYLabel || 'Y Axis'

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      <div
        className="relative aspect-square rounded-xl border"
        style={{ backgroundColor: `${textColor}08`, borderColor: `${textColor}20` }}
      >
        {/* Axis dividers */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
          style={{ height: 1, backgroundColor: `${textColor}20` }}
        />
        <div
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
          style={{ width: 1, backgroundColor: `${textColor}20` }}
        />

        {/* Axis labels */}
        <span
          className="absolute bottom-2 right-3 text-xs font-medium"
          style={{ color: textColor, opacity: 0.4 }}
        >
          {axisXLabel} →
        </span>
        <span
          className="absolute top-2 left-3 text-xs font-medium"
          style={{ color: textColor, opacity: 0.4 }}
        >
          ↑ {axisYLabel}
        </span>

        {/* Data points */}
        {data.map((item, i) => (
          <div
            key={item.option}
            className="absolute flex flex-col items-center"
            style={{
              left: `${item.avgX}%`,
              top: `${100 - item.avgY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full shadow-lg border-2 border-white"
              style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
            />
            <span
              className="text-[10px] font-bold whitespace-nowrap rounded px-1 py-0.5 mt-0.5"
              style={{
                color: textColor,
                backgroundColor: `${textColor}15`,
              }}
            >
              {item.option}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((item, i) => (
          <div key={item.option} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
            />
            <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.7 }}>
              {item.option}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
