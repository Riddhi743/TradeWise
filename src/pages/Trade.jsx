import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { marketService } from '@/services/marketService'
import { tradeService } from '@/services/tradeService'
import { summarize } from '@/utils/portfolio'
import { inr, signedInr } from '@/utils/format'
import PriceChart from '@/components/PriceChart'
import OrderForm from '@/components/OrderForm'
import TradeReview from '@/components/TradeReview'
import { reviewOrder } from '@/utils/review'
import SentimentWidget from '@/components/SentimentWidget'

const panel = 'rounded-2xl border border-line bg-surface p-5'
const day = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default function Trade() {
  const [stocks, setStocks] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [symbol, setSymbol] = useState('RELIANCE')
  const [history, setHistory] = useState([])
  const [query, setQuery] = useState('')
  const [reviewing, setReviewing] = useState(null)

  useEffect(() => {
    Promise.all([marketService.getStocks(), tradeService.getPortfolio()]).then(([s, p]) => {
      setStocks(s)
      setPortfolio(p)
    })
  }, [])

  useEffect(() => {
    marketService.getHistory(symbol).then(setHistory)
  }, [symbol])

  const stock = stocks.find((s) => s.symbol === symbol)
  if (!portfolio || !stock) return <p className="text-muted">Loading…</p>

  const s = summarize(portfolio, stocks)
  const holding = s.rows.find((r) => r.symbol === symbol)
  const shown = stocks.filter((x) => (x.symbol + x.name).toLowerCase().includes(query.toLowerCase()))
  const recent = [...portfolio.trades].reverse().slice(0, 8)

  const submit = async (order) => {
    const review = reviewOrder({ order, summary: s, holding })
    const { portfolio: next, trade } = await tradeService.placeOrder({ ...order, review })
    setPortfolio(next)
    setReviewing(trade)
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Trade</h1>
          <p className="text-muted">Practice with virtual money. Nothing here is real.</p>
        </div>
        <p className="text-sm text-muted">Cash <span className="font-mono text-ink">{inr(portfolio.cash)}</span> · Portfolio <span className="font-mono text-ink">{inr(s.totalValue)}</span></p>
      </div>

      {/* {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/10 p-4 mb-4 text-sm">
          <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-brand" aria-hidden /> {notice}</span>
          <Link to="/dashboard" className="text-brand font-medium">View dashboard</Link>
        </div>
      )} */}
            {reviewing && <TradeReview trade={reviewing} onClose={() => setReviewing(null)} />}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 space-y-4">
          <section className={panel}>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stocks" aria-label="Search stocks"
                className="w-full min-h-11 pl-9 pr-3 rounded-xl bg-surface-2 border border-line focus:border-brand/60 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              {shown.map((x) => (
                <button key={x.symbol} aria-pressed={x.symbol === symbol} onClick={() => setSymbol(x.symbol)}
                  className={`px-3 py-2 rounded-xl border text-left cursor-pointer transition-colors ${x.symbol === symbol ? 'border-brand bg-brand/10' : 'border-line hover:bg-surface-2'}`}>
                  <p className="text-sm font-semibold">{x.symbol}</p>
                  <p className="text-xs font-mono text-muted">{inr(x.price)}</p>
                </button>
              ))}
              {shown.length === 0 && <p className="text-sm text-muted">No stocks match.</p>}
            </div>
          </section>

          <section className={panel}>
            <div className="mb-3">
              <h2 className="font-semibold">{stock.name}</h2>
              <p className="text-xs text-muted">{stock.sector} · last 60 days (sample data)</p>
            </div>
            <PriceChart history={history} stopLoss={holding?.stopLoss} />
          <SentimentWidget symbol={symbol} />
          </section>
        </div>

        <OrderForm key={symbol} stock={stock} cash={portfolio.cash} totalValue={s.totalValue} holding={holding} onSubmit={submit} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className={panel}>
          <h2 className="font-semibold mb-3">Your holdings</h2>
          {s.rows.length === 0 ? (
            <p className="text-sm text-muted">No holdings yet. Place a buy order to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted text-xs border-b border-line">
                    <th className="pb-2 font-medium">Stock</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Avg</th>
                    <th className="pb-2 font-medium text-right">P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {s.rows.map((r) => (
                    <tr key={r.symbol} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 font-sans"><button onClick={() => setSymbol(r.symbol)} className="font-semibold text-brand hover:underline cursor-pointer">{r.symbol}</button></td>
                      <td className="py-2.5 text-right">{r.qty}</td>
                      <td className="py-2.5 text-right">{inr(r.avgPrice)}</td>
                      <td className={`py-2.5 text-right ${r.pnl >= 0 ? 'text-brand' : 'text-danger'}`}>{signedInr(r.pnl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={panel}>
          <h2 className="font-semibold mb-3">Trade history</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">Your trades will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${t.side === 'BUY' ? 'bg-brand/15 text-brand' : 'bg-danger/15 text-danger'}`}>{t.side}</span>
                    <span><span className="font-semibold">{t.symbol}</span> <span className="text-xs text-muted font-mono">{t.qty} @ {inr(t.price)}</span></span>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-muted">{day(t.date)}</p>
                                        {t.review && <button onClick={() => { setReviewing(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="text-brand hover:underline cursor-pointer">Review</button>}
                    {t.pnl !== undefined && <p className={`font-mono ${t.pnl >= 0 ? 'text-brand' : 'text-danger'}`}>{signedInr(t.pnl)}</p>}
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