import { Tilt } from './fx'

export default function StatCard({ label, value, sub, tone, icon: Icon }) {
  const toneCls = tone === 'up' ? 'text-brand' : tone === 'down' ? 'text-danger' : 'text-muted'
  return (
    <Tilt className="glass glow-border glow-hover h-full rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && (
          <span className="size-9 grid place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-brand ring-1 ring-white shadow-sm">
            <Icon size={18} aria-hidden />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
      {sub && <p className={`text-sm font-mono mt-1 ${toneCls}`}>{sub}</p>}
    </Tilt>
  )
}