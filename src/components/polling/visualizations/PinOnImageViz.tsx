import type { PinOnImageResult, SlideSettings } from '@/types/polling'

const PIN_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#EAB308']

export default function PinOnImageViz({
  data,
  settings,
  textColor = '#111827',
}: {
  data: PinOnImageResult
  settings?: SlideSettings
  textColor?: string
}) {
  if (!settings?.imageUrl) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        No image configured for this slide.
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
      <div className="relative inline-block w-full rounded-xl overflow-hidden shadow-lg">
        <img src={settings.imageUrl} alt="" className="w-full rounded-xl" />
        {data.map((pin, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
            title={pin.participantName}
          >
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <path
                d="M10 0C4.477 0 0 4.477 0 10C0 16.5 10 24 10 24C10 24 20 16.5 20 10C20 4.477 15.523 0 10 0Z"
                fill={PIN_COLORS[i % PIN_COLORS.length]}
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="10" r="4" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
        ))}
      </div>
      <div className="text-sm font-medium" style={{ color: textColor, opacity: 0.5 }}>
        {data.length} {data.length === 1 ? 'response' : 'responses'}
      </div>
    </div>
  )
}
