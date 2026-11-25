import { useId, useMemo, useState } from 'react'
import { ComposedChart, LineChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'
import { sma, rsi } from '@/utils/indicators'
import { inr } from '@/utils/format'
import ChartTip from './ChartTip'

const cursor = { stroke: 'rgba(15,40,70,.18)', strokeDasharray: '3 4' }
const axis = { stroke: '#64748b', fontSize: 11, tickLine: false, axisLine: false }

export default function PriceChart({ history, stopLoss }) {
  const uid = useId().replace(/:/g, '')
  const [show, setShow] = useState({ sma20: true, sma50: false, rsi: false })
  const toggle = (k) => setShow({ ...show, [k]: !show[k] })

  const data = useMemo(() => {
    const closes = history.map((h) => h.close)
    const s20 = sma(closes, 20)
    const s50 = sma(closes, 50)
    const r = rsi(closes)
    const f = (v, d = 2) => (v == null ? null : +v.toFixed(d))
    return history
      .map((h, i) => ({ date: h.date.slice(5), close: f(h.close), sma20: f(s20[i]), sma50: f(s50[i]), rsi: f(r[i], 1) }))
      .slice(-60)
  }, [history])

  const chips = [
    ['sma20', 'SMA 20', '#3b82f6'],
    ['sma50', 'SMA 50', '#f59e0b'],
    ['rsi', 'RSI', '#8b5cf6'],
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map(([k, label, color]) => (
          <button
            key={k}
            aria-pressed={show[k]}
            onClick={() => toggle(k)}
            className={`inline-flex items-center gap-2 min-h-9 px-3 rounded-full border text-xs font-semibold cursor-pointer transition-all ${show[k] ? 'border-brand/50 bg-white shadow-sm' : 'border-line bg-white/40 text-muted hover:bg-white/80'}`}
          >
            <span className="size-2 rounded-full" style={{ background: color }} aria-hidden /> {label}
          </button>
        ))}
      </div>

      <div className="h-72" role="img" aria-label="Price chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(15,40,70,.09)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="date" {...axis} minTickGap={30} />
            <YAxis {...axis} domain={['auto', 'auto']} width={56} tickFormatter={(v) => Math.round(v)} />
            <Tooltip content={<ChartTip format={inr} />} cursor={cursor} />
            <Area type="monotone" dataKey="close" stroke="none" fill={`url(#${uid}f)`} legendType="none" tooltipType="none" isAnimationActive={false} />
            <Line type="monotone" dataKey="close" name="Price" stroke={`url(#${uid}s)`} strokeWidth={2.6} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            {show.sma20 && <Line type="monotone" dataKey="sma20" name="SMA 20" stroke="#3b82f6" strokeWidth={1.6} dot={false} connectNulls />}
            {show.sma50 && <Line type="monotone" dataKey="sma50" name="SMA 50" stroke="#f59e0b" strokeWidth={1.6} dot={false} connectNulls />}
            {stopLoss && <ReferenceLine y={stopLoss} stroke="#e11d48" strokeDasharray="4 4" label={{ value: 'Your stop-loss', fill: '#e11d48', fontSize: 11, position: 'insideBottomRight' }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {show.rsi && (
        <div className="mt-4">
          <p className="text-xs text-muted mb-1">RSI (14): above 70 is often read as overbought, below 30 as oversold.</p>
          <div className="h-32" role="img" aria-label="RSI chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(15,40,70,.09)" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis {...axis} domain={[0, 100]} ticks={[30, 70]} width={56} />
                <Tooltip content={<ChartTip />} cursor={cursor} />
                <ReferenceLine y={70} stroke="#e11d48" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rsi" name="RSI" stroke="#8b5cf6" strokeWidth={1.5} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}