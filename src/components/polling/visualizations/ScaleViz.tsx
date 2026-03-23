import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ScaleResult, ScaleStatementResult, SlideSettings } from '@/types/polling'
import { SCALE_COLORS as STATEMENT_COLORS } from '@/config/polling'

function normalizeScaleData(data: unknown): ScaleStatementResult[] {
  if (!Array.isArray(data) || data.length === 0) return []
  if ('value' in data[0] && !('statement' in data[0])) {
    const oldData = data as { value: number; count: number }[]
    const total = oldData.reduce((s, d) => s + d.count, 0)
    const avg = total > 0 ? oldData.reduce((s, d) => s + d.value * d.count, 0) / total : 0
    return [{
      statement: 'Rating',
      distribution: oldData,
      average: avg,
      responseCount: total,
    }]
  }
  return data as ScaleStatementResult[]
}

function smoothDistribution(
  distribution: { value: number; count: number }[],
  min: number,
  max: number,
  points = 80,
): { x: number; y: number }[] {
  if (distribution.length === 0) return []
  const range = max - min
  const bandwidth = Math.max(range * 0.08, 0.5)
  const result: { x: number; y: number }[] = []
  for (let i = 0; i < points; i++) {
    const x = min + (i / (points - 1)) * range
    let y = 0
    for (const d of distribution) {
      const diff = (x - d.value) / bandwidth
      y += d.count * Math.exp(-0.5 * diff * diff)
    }
    result.push({ x, y })
  }
  const maxY = Math.max(...result.map((p) => p.y), 0.001)
  return result.map((p) => ({ x: p.x, y: p.y / maxY }))
}

function buildCurvePath(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  min: number,
  max: number,
): string {
  if (points.length === 0) return ''
  const range = max - min || 1
  const xScale = (v: number) => ((v - min) / range) * width
  const yScale = (v: number) => height - v * height * 0.85

  let d = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (xScale(prev.x) + xScale(curr.x)) / 2
    d += ` C ${cpx} ${yScale(prev.y)}, ${cpx} ${yScale(curr.y)}, ${xScale(curr.x)} ${yScale(curr.y)}`
  }
  d += ` L ${width} ${height} L 0 ${height} Z`
  return d
}

function buildStrokePath(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  min: number,
  max: number,
): string {
  if (points.length === 0) return ''
  const range = max - min || 1
  const xScale = (v: number) => ((v - min) / range) * width
  const yScale = (v: number) => height - v * height * 0.85

  let d = `M ${xScale(points[0].x)} ${yScale(points[0].y)}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (xScale(prev.x) + xScale(curr.x)) / 2
    d += ` C ${cpx} ${yScale(prev.y)}, ${cpx} ${yScale(curr.y)}, ${xScale(curr.x)} ${yScale(curr.y)}`
  }
  return d
}

function StatementRow({
  item,
  color,
  min,
  max,
  textColor,
  minLabel,
  maxLabel,
  index,
}: {
  item: ScaleStatementResult
  color: string
  min: number
  max: number
  textColor: string
  minLabel: string
  maxLabel: string
  index: number
}) {
  const svgWidth = 600
  const svgHeight = 60
  const range = max - min || 1

  const smoothed = useMemo(
    () => smoothDistribution(item.distribution, min, max),
    [item.distribution, min, max],
  )
  const fillPath = useMemo(
    () => buildCurvePath(smoothed, svgWidth, svgHeight, min, max),
    [smoothed, min, max],
  )
  const strokePath = useMemo(
    () => buildStrokePath(smoothed, svgWidth, svgHeight, min, max),
    [smoothed, min, max],
  )

  const avgX = ((item.average - min) / range) * 100
  const barProgress = ((item.average - min) / range) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20, delay: index * 0.1 }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-sm font-bold" style={{ color: textColor }}>
          {item.statement}
        </span>
      </div>

      <div className="relative">
        {/* Background bar */}
        <div className="h-2 rounded-full w-full" style={{ backgroundColor: 'rgba(128,128,128,0.15)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: '0%' }}
            animate={{ width: `${barProgress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 18, delay: index * 0.1 + 0.2 }}
          />
        </div>

        {/* Wave overlay */}
        {item.responseCount > 0 && (
          <div className="absolute -top-12 left-0 right-0 pointer-events-none" style={{ height: svgHeight }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <motion.path
                d={fillPath}
                fill={color}
                fillOpacity={0.15}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
              />
              <motion.path
                d={strokePath}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
              />
            </svg>
          </div>
        )}

        {/* Average circle */}
        {item.responseCount > 0 && (
          <motion.div
            className="absolute -top-3 flex items-center justify-center"
            style={{ left: `${avgX}%`, transform: 'translateX(-50%)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: index * 0.1 + 0.5 }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg"
              style={{ backgroundColor: color }}
            >
              {item.average.toFixed(1)}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default function ScaleViz({
  data,
  textColor = '#111827',
  settings,
}: {
  data: ScaleResult
  textColor?: string
  settings?: SlideSettings
}) {
  const normalized = useMemo(() => normalizeScaleData(data), [data])

  if (normalized.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for responses...
      </div>
    )
  }

  const min = settings?.scaleMin ?? settings?.maxSelections ?? 1
  const max = settings?.scaleMax ?? settings?.maxWords ?? 10
  const minLabel = settings?.scaleMinLabel || 'Strongly disagree'
  const maxLabel = settings?.scaleMaxLabel || 'Strongly agree'

  return (
    <div className="flex flex-col gap-10 w-full max-w-3xl mx-auto p-6">
      {normalized.map((item, i) => (
        <StatementRow
          key={item.statement}
          item={item}
          color={settings?.scaleColors?.[i] || STATEMENT_COLORS[i % STATEMENT_COLORS.length]}
          min={min}
          max={max}
          textColor={textColor}
          minLabel={minLabel}
          maxLabel={maxLabel}
          index={i}
        />
      ))}
      <div className="flex justify-between -mt-4">
        <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.45 }}>
          {minLabel}
        </span>
        <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.45 }}>
          {maxLabel}
        </span>
      </div>
    </div>
  )
}
