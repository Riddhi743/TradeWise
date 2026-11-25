/** Small glass tooltip used by all charts. */
export default function ChartTip({ active, payload, label, format = (v) => v, total, colorOf }) {
  if (!active || !payload?.length) return null
  const colorFor = (p) => {
    if (colorOf) return colorOf(p)
    return typeof p.color === 'string' && p.color.startsWith('#') ? p.color : '#10b981'
  }
  return (
    <div className="rounded-xl bg-white/90 px-3 py-2 text-xs shadow-[0_8px_24px_-8px_rgba(30,64,110,.35)] ring-1 ring-white backdrop-blur-md">
      {label != null && label !== '' && <p className="mb-1 font-semibold text-muted">{label}</p>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey ?? p.name} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: colorFor(p) }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto pl-3 font-mono font-bold text-ink">
              {format(p.value)}
              {total ? <span className="font-medium text-muted"> · {((p.value / total) * 100).toFixed(1)}%</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}