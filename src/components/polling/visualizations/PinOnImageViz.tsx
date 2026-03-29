import type { PinOnImageResult, SlideSettings } from '@/types/polling'
import { PIN_COLORS } from '@/config/polling'
import MapPinIcon from '@/components/ui/MapPinIcon'

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
            <MapPinIcon color={PIN_COLORS[i % PIN_COLORS.length]} />
          </div>
        ))}
      </div>
      <div className="text-sm font-medium" style={{ color: textColor, opacity: 0.5 }}>
        {data.length} {data.length === 1 ? 'response' : 'responses'}
      </div>
    </div>
  )
}
