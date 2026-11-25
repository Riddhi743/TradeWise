import { useId } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { inr } from '@/utils/format'
import ChartTip from './ChartTip'

// [light, base] pairs -> each slice gets a soft gradient
const COLORS = [
  ['#6ee7b7', '#10b981'], ['#93c5fd', '#3b82f6'], ['#fcd34d', '#f59e0b'],
  ['#c4b5fd', '#8b5cf6'], ['#f9a8d4', '#ec4899'], ['#5eead4', '#14b8a6'],
]
const CASH = ['#cbd5e1', '#94a3b8']
const pairFor = (d, i) => (d.name === 'Cash' ? CASH : COLORS[i % COLORS.length])

export default function AllocationChart({ data }) {
  const uid = useId().replace(/:/g, '')
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div>
      <div className="h-52" role="img" aria-label="Portfolio allocation chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((d, i) => {
                const [a, b] = pairFor(d, i)
                return (
                  <linearGradient key={d.name} id={`${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={a} />
                    <stop offset="100%" stopColor={b} />
                  </linearGradient>
                )
              })}
            </defs>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} cornerRadius={6} stroke="#fff" strokeWidth={2}>
              {data.map((d, i) => <Cell key={d.name} fill={`url(#${uid}-${i})`} />)}
            </Pie>
            <Tooltip
              cursor={false}
              content={<ChartTip format={inr} total={total} colorOf={(p) => pairFor(p.payload, data.findIndex((d) => d.name === p.name))[1]} />}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: pairFor(d, i)[1] }} aria-hidden />
              {d.name}
            </span>
            <span className="font-mono text-muted">{((d.value / total) * 100).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}