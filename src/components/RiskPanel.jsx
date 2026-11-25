import { Link } from 'react-router-dom'
import { inr } from '@/utils/format'

const chip = {
  Diversified: 'bg-brand/15 text-brand',
  Moderate: 'bg-warn/15 text-warn',
  Concentrated: 'bg-danger/15 text-danger',
}
const tile = 'rounded-xl bg-surface-2 p-4'
const lesson = (title, topic) => `/learn?topic=${topic}&lesson=${encodeURIComponent(title)}`

export default function RiskPanel({ risk }) {
  if (!risk) return null
  const r = risk
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 mb-6" aria-label="Risk overview">
      <h2 className="font-semibold mb-4">Risk overview</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={tile}>
          <p className="text-xs text-muted mb-2">Diversification</p>
          <span className={`text-sm font-semibold px-2.5 py-1 rounded-md ${chip[r.diversification]}`}>{r.diversification}</span>
          <p className="text-xs text-muted mt-3">Largest holding: <span className="font-mono text-ink">{r.top.symbol} {r.top.pct.toFixed(1)}%</span></p>
          {r.diversification !== 'Diversified' && (
            <Link to={lesson('Diversification', 'portfolio')} className="text-xs text-brand hover:underline mt-1 inline-block">Learn diversification</Link>
          )}
        </div>

        <div className={tile}>
          <p className="text-xs text-muted mb-2">Sector exposure</p>
          <ul className="space-y-2">
            {r.sectors.map((s) => (
              <li key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{s.name}</span><span className="font-mono text-muted">{s.pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className={`h-full rounded-full ${s.pct > 40 ? 'bg-warn' : 'bg-brand'}`} style={{ width: `${Math.min(s.pct, 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={tile}>
          <p className="text-xs text-muted mb-2">Stop-loss protection</p>
          <p className="text-xl font-bold font-mono">{inr(r.lossIfStopped)}</p>
          <p className="text-xs text-muted">max loss if every stop-loss hits ({r.lossIfStoppedPct.toFixed(1)}% of portfolio)</p>
          {r.unprotectedCount > 0 && (
            <p className="text-xs text-warn mt-2">
              {inr(r.unprotectedValue)} in {r.unprotectedCount} holding{r.unprotectedCount > 1 ? 's' : ''} has no stop-loss.{' '}
              <Link to={lesson('Stop-loss', 'portfolio')} className="text-brand hover:underline">Learn</Link>
            </p>
          )}
        </div>

        <div className={tile}>
          <p className="text-xs text-muted mb-2">Max drawdown</p>
          <p className="text-xl font-bold font-mono">{r.maxDrawdown.toFixed(1)}%</p>
          <p className="text-xs text-muted">largest fall from a portfolio peak since your first trade</p>
          <Link to={lesson('Drawdown', 'portfolio')} className="text-xs text-brand hover:underline mt-2 inline-block">What is drawdown?</Link>
        </div>
      </div>
    </section>
  )
}