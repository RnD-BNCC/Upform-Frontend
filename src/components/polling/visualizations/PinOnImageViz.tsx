import type { PinOnImageResult, SlideSettings } from '@/types/polling'
import { PIN_COLORS } from '@/config/polling'
import { MapPinMarkerIcon } from '@/components/icons'

function inCorrectArea(
  pin: { x: number; y: number },
  area: { x: number; y: number; width: number; height: number },
) {
  return (
    pin.x >= area.x &&
    pin.x <= area.x + area.width &&
    pin.y >= area.y &&
    pin.y <= area.y + area.height
  )
}

export default function PinOnImageViz({
  data,
  settings,
  textColor = '#111827',
  revealPhase,
}: {
  data: PinOnImageResult
  settings?: SlideSettings
  textColor?: string
  revealPhase?: boolean
}) {
  if (!settings?.pinImageUrl) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        No image configured for this slide.
      </div>
    )
  }

  const correctArea = settings.correctArea
  const showArea = revealPhase && correctArea

  const inCount = showArea
    ? data.filter((p) => inCorrectArea(p, correctArea!)).length
    : 0

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
      <div className="relative inline-block w-full rounded-xl overflow-hidden shadow-lg">
        <img src={settings.pinImageUrl} alt="" className="w-full rounded-xl" />

        {showArea && (
          <div
            className="absolute pointer-events-none border-2 border-green-400 transition-all duration-500"
            style={{
              left: `${correctArea!.x}%`,
              top: `${correctArea!.y}%`,
              width: `${correctArea!.width}%`,
              height: `${correctArea!.height}%`,
              backgroundColor: 'rgba(34,197,94,0.18)',
            }}
          />
        )}

        {data.map((pin, i) => {
          const correct = showArea ? inCorrectArea(pin, correctArea!) : null
          const color = showArea
            ? (correct ? '#22C55E' : '#EF4444')
            : PIN_COLORS[i % PIN_COLORS.length]
          return (
            <div
              key={i}
              className="absolute pointer-events-none transition-all duration-300"
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
              title={pin.participantName}
            >
              <MapPinMarkerIcon color={color} />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 text-sm font-medium" style={{ color: textColor, opacity: 0.6 }}>
        <span>{data.length} {data.length === 1 ? 'response' : 'responses'}</span>
        {showArea && (
          <span className="text-green-600 font-semibold opacity-100">
            · {inCount} / {data.length} in correct area
          </span>
        )}
      </div>
    </div>
  )
}
