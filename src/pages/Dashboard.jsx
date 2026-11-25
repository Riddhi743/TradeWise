import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, PiggyBank, TrendingUp, Percent, ArrowRight, AlertTriangle, Sparkles, RotateCcw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { tradeService } from '@/services/tradeService'
import { marketService } from '@/services/marketService'
import { modules } from '@/data/modules'
import { summarize } from '@/utils/portfolio'
import { portfolioRisk } from '@/utils/riskMetrics'
import { inr, signedInr, signedPct } from '@/utils/format'
import { btn } from '@/components/ui'
import StatCard from '@/components/StatCard'
import AllocationChart from '@/components/AllocationChart'
import RiskPanel from '@/components/RiskPanel'

const panel = 'rounded-2xl border border-line bg-surface p-5'
const tone = (n) => (n > 0 ? 'up' : n < 0 ? 'down' : undefined)
const day = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const barColor = (pct) => (pct >= 70 ? 'bg-brand' : pct >= 40 ? 'bg-warn' : 'bg-danger')

export default function Dashboard() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [stocks, setStocks] = useState([])
  const [histories, setHistories] = useState({})

  useEffect(() => {
    Promise.all([tradeService.getPortfolio(), marketService.getStocks()]).then(([p, s]) => {
      setPortfolio(p)
      setStocks(s)
    })
  }, [])

  // price history for every stock ever traded (used for max drawdown)
  useEffect(() => {
    if (!portfolio) return
    const symbols = [...new Set(portfolio.trades.map((t) => t.symbol))]
    Promise.all(symbols.map((x) => marketService.getHistory(x))).then((hs) =>
      setHistories(Object.fromEntries(symbols.map((x, i) => [x, hs[i]])))
    )
  }, [portfolio])

  if (!portfolio) return <p className="text-muted">Loading…</p>

  const s = summarize(portfolio, stocks)
  const risk = portfolioRisk(s, portfolio.trades, histories)
  const empty = portfolio.holdings.length === 0 && portfolio.trades.length === 0
  const noStop = s.rows.filter((r) => !r.stopLoss)
  const recent = [...portfolio.trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  const assessment = user?.assessment
  const rec = modules.find((m) => m.id === assessment?.recommended) ?? modules[0]

  const loadDemo = async () => setPortfolio(await tradeService.loadDemo())
  const reset = async () => setPortfolio(await tradeService.reset())

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted">Here is how your practice portfolio is doing.</p>
        </div>
        <Link to="/trade" className={btn('primary')}>New trade <ArrowRight size={18} aria-hidden /></Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Portfolio value" value={inr(s.totalValue)} sub={`${inr(s.marketValue)} invested`} />
        <StatCard icon={PiggyBank} label="Cash available" value={inr(portfolio.cash)} sub="Virtual money" />
        <StatCard icon={TrendingUp} label="Total P&L" value={signedInr(s.totalPnl)} tone={tone(s.totalPnl)} sub={`Realized ${signedInr(s.realized)}`} />
        <StatCard icon={Percent} label="Return" value={signedPct(s.returnPct)} tone={tone(s.returnPct)} sub="On ₹10,00,000" />
      </div>

      {empty ? (
        <div className={`${panel} text-center py-12 mb-6`}>
          <h2 className="text-xl font-bold mb-2">No trades yet</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">Place your first virtual trade, or load sample data to preview what the dashboard looks like.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/trade" className={btn('primary')}>Go to Trade</Link>
            <button onClick={loadDemo} className={btn('ghost')}>Load sample data</button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <section className={`${panel} lg:col-span-2`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Holdings</h2>
              <button onClick={reset} className="text-xs text-muted hover:text-ink cursor-pointer">Reset sample data</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-line">
                    <th className="pb-2 font-medium">Stock</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Avg</th>
                    <th className="pb-2 font-medium text-right">LTP</th>
                    <th className="pb-2 font-medium text-right">P&amp;L</th>
                    <th className="pb-2 font-medium text-right">Stop-loss</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {s.rows.map((r) => (
                    <tr key={r.symbol} className="border-b border-line/60 last:border-0">
                      <td className="py-3 font-sans">
                        <p className="font-semibold">{r.symbol}</p>
                        <p className="text-xs text-muted">{r.sector}</p>
                      </td>
                      <td className="py-3 text-right">{r.qty}</td>
                      <td className="py-3 text-right">{inr(r.avgPrice)}</td>
                      <td className="py-3 text-right">{inr(r.ltp)}</td>
                      <td className={`py-3 text-right ${r.pnl >= 0 ? 'text-brand' : 'text-danger'}`}>
                        {signedInr(r.pnl)}
                        <span className="block text-xs">{signedPct(r.pnlPct)}</span>
                      </td>
                      <td className="py-3 text-right">
                        {r.stopLoss ? inr(r.stopLoss) : <span className="text-xs font-sans px-2 py-0.5 rounded-md bg-warn/15 text-warn">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={panel}>
            <h2 className="font-semibold mb-2">Allocation</h2>
            <AllocationChart data={s.allocation} />
          </section>
        </div>
      )}

      {noStop.length > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 mb-6 flex gap-3">
          <AlertTriangle size={20} className="text-warn shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold">{noStop.length} holding{noStop.length > 1 ? 's have' : ' has'} no stop-loss</span>
            {' '}({noStop.map((r) => r.symbol).join(', ')}). A stop-loss caps how much one trade can cost you.{' '}
            <Link to="/learn" className="text-brand font-medium">Learn about stop-loss</Link>
          </p>
        </div>
      )}

      <RiskPanel risk={risk} />

      <div className="grid lg:grid-cols-3 gap-4">
        <section className={panel}>
          <h2 className="font-semibold mb-3">Study next</h2>
          <div className="rounded-xl border border-brand/30 bg-brand/10 p-4 mb-4">
            <p className="flex items-center gap-2 text-sm text-brand font-semibold mb-1"><Sparkles size={16} aria-hidden /> Recommended</p>
            <p className="font-bold">{rec.title}</p>
            <p className="text-sm text-muted mt-1">
              {assessment?.weakTopics?.length ? 'Based on your quiz, this is where you can improve most.' : 'A good place to start.'}
            </p>
          </div>
          <Link to="/learn" className={`${btn('ghost')} w-full`}>Open lessons</Link>
        </section>

        <section className={panel}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Quiz results</h2>
            <Link to="/quiz" className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline">
              <RotateCcw size={14} aria-hidden /> {assessment ? 'Retake' : 'Take quiz'}
            </Link>
          </div>
          {assessment ? (
            <>
              <p className="text-sm text-muted mb-4">Level: <span className="text-ink font-semibold">{assessment.level}</span> · {assessment.correct}/{assessment.total} correct</p>
              <ul className="space-y-3">
                {modules.map((m) => {
                  const t = assessment.byTopic?.[m.id]
                  const tested = t && t.total > 0
                  return (
                    <li key={m.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{m.title}</span>
                        <span className="font-mono text-muted">{tested ? `${t.pct}%` : 'Not tested'}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        {tested && <div className={`h-full rounded-full ${barColor(t.pct)}`} style={{ width: `${t.pct}%` }} />}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted">You skipped the quiz. Your topic scores will appear here once you take it.</p>
          )}
        </section>

        <section className={panel}>
          <h2 className="font-semibold mb-3">Recent trades</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Your trades will show up here.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.side === 'BUY' ? 'bg-brand/15 text-brand' : 'bg-danger/15 text-danger'}`}>{t.side}</span>
                    <div>
                      <p className="font-semibold">{t.symbol}</p>
                      <p className="text-xs text-muted font-mono">{t.qty} @ {inr(t.price)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">{day(t.date)}</p>
                    {t.pnl !== undefined && <p className={`text-xs font-mono ${t.pnl >= 0 ? 'text-brand' : 'text-danger'}`}>{signedInr(t.pnl)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}