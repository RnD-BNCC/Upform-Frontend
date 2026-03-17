import { useState, useCallback, useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from '@/utils/response-aggregation'

interface PieChartCardProps {
  data: Array<{ name: string; value: number }>
}

interface HoveredSlice {
  index: number
  x: number
  y: number
}

const RADIAN = Math.PI / 180

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) / 2
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#ffffff"
      fontSize={11}
      fontWeight={600}
    >
      {(percent * 100).toFixed(1)}%
    </text>
  )
}

export default function PieChartCard({ data }: PieChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const filtered = data.filter((d) => d.value > 0)
  const [hovered, setHovered] = useState<HoveredSlice | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseEnter = useCallback((sectorData: any, index: number) => {
    const wrapper = containerRef.current?.querySelector('.recharts-wrapper')
    if (!wrapper) return
    const wrapperRect = wrapper.getBoundingClientRect()
    const containerRect = containerRef.current!.getBoundingClientRect()
    const offsetX = wrapperRect.left - containerRect.left
    const offsetY = wrapperRect.top - containerRect.top

    const { cx, cy, midAngle, outerRadius } = sectorData
    const tooltipRadius = outerRadius + 40
    const x = offsetX + cx + tooltipRadius * Math.cos(-midAngle * RADIAN)
    const y = offsetY + cy + tooltipRadius * Math.sin(-midAngle * RADIAN)

    setHovered({ index, x, y })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
  }, [])

  if (total === 0) {
    return <p className="text-sm text-gray-400 py-4">No responses</p>
  }

  const hoveredItem = hovered ? filtered[hovered.index] : null
  const hoveredColor = hovered ? CHART_COLORS[hovered.index % CHART_COLORS.length] : ''

  return (
    <div className="flex items-center gap-6 py-2">
      <div ref={containerRef} className="relative w-50 h-50 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              labelLine={false}
              isAnimationActive={false}
              label={renderLabel}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" strokeWidth={0} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {hovered && hoveredItem && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: hovered.x,
              top: hovered.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="bg-white rounded-lg px-3 py-1.5 shadow-lg border border-gray-200 text-xs whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hoveredColor }} />
                <span className="font-semibold text-gray-800">{hoveredItem.name}</span>
              </div>
              <p className="text-gray-500 ml-3.5">{hoveredItem.value} ({((hoveredItem.value / total) * 100).toFixed(1)}%)</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 min-w-0">
        {data.map((item, i) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'
          return (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-gray-700 truncate">{item.name}</span>
              <span className="text-gray-400 ml-auto shrink-0">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
