import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { CHART_COLORS } from '@/utils/response-aggregation'

interface BarChartCardProps {
  data: Array<{ label: string; count: number }>
  layout?: 'horizontal' | 'vertical'
  colorful?: boolean
}

export default function BarChartCard({ data, layout = 'vertical', colorful = false }: BarChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  if (total === 0) {
    return <p className="text-sm text-gray-400 py-4">No responses</p>
  }

  if (layout === 'horizontal') {
    return (
      <div className="py-2 space-y-2.5">
        {data.map((item, i) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="w-32 text-gray-700 truncate shrink-0">{item.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    backgroundColor: colorful ? CHART_COLORS[i % CHART_COLORS.length] : '#0054a5',
                  }}
                />
              </div>
              <span className="text-gray-500 text-xs w-8 text-right shrink-0">{item.count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const dataWithPct = data.map((d) => ({
    ...d,
    pctLabel: `${d.count} (${total > 0 ? ((d.count / total) * 100).toFixed(1) : '0'}%)`,
  }))

  return (
    <div className="h-55 py-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dataWithPct} margin={{ top: 24, right: 5, bottom: 5, left: -15 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList
              dataKey="pctLabel"
              position="top"
              fill="#0054a5"
              fontSize={11}
              fontWeight={600}
              offset={6}
            />
            {dataWithPct.map((_, i) => (
              <Cell key={i} fill={colorful ? CHART_COLORS[i % CHART_COLORS.length] : '#0054a5'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
