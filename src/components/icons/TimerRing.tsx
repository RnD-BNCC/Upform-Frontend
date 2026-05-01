import TimerRingSvg from "./TimerRingSvg";

export function TimerRing({
  remaining,
  total,
  size = 56,
  trackColor,
}: {
  remaining: number
  total: number
  size?: number
  trackColor?: string
}) {
  const strokeWidth = Math.max(4, size * 0.09)
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.max(0, remaining / total) : 0
  const dashOffset = circumference * (1 - pct)

  const color =
    remaining <= 10 ? '#EF4444'
    : pct < 0.3 ? '#F59E0B'
    : '#10B981'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <TimerRingSvg
        size={size}
        radius={radius}
        strokeWidth={strokeWidth}
        circumference={circumference}
        dashOffset={dashOffset}
        color={color}
        trackColor={trackColor}
      />
      <span
        className="relative font-black tabular-nums"
        style={{
          fontSize: size < 50 ? 12 : size < 70 ? 18 : 24,
          color,
          transition: 'color 0.5s ease',
        }}
      >
        {remaining}
      </span>
    </div>
  )
}
