import { Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Info, X, ArrowRight } from 'lucide-react'
import { inr, signedInr } from '@/utils/format'

const icon = {
  ok: <CheckCircle2 size={18} className="text-brand shrink-0 mt-0.5" aria-hidden />,
  warn: <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" aria-hidden />,
  info: <Info size={18} className="text-muted shrink-0 mt-0.5" aria-hidden />,
}

export default function TradeReview({ trade, onClose }) {
  const review = trade.review
  const lessons = review?.lessons ?? []
  const buy = trade.side === 'BUY'

  return (
    <section aria-label="Trade review" className="rounded-2xl border border-line bg-surface p-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-muted font-mono">Trade Review</p>
          <h2 className="font-bold text-lg">
            <span className={buy ? 'text-brand' : 'text-danger'}>{trade.side}</span> {trade.symbol}
            <span className="text-sm font-normal text-muted font-mono"> · {trade.qty} @ {inr(trade.price)}</span>
          </h2>
          {trade.pnl !== undefined && (
            <p className={`text-sm font-mono ${trade.pnl >= 0 ? 'text-brand' : 'text-danger'}`}>Realized {signedInr(trade.pnl)}</p>
          )}
        </div>
        <button onClick={onClose} aria-label="Close review" className="size-9 grid place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {!review ? (
        <p className="text-sm text-muted">No review is available for this trade. It was added as sample data.</p>
      ) : (
        <>
          <ul className="space-y-2.5 text-sm mb-4">
            {review.checks.map((c, i) => (
              <li key={i} className="flex gap-2.5">{icon[c.status]} <span>{c.text}</span></li>
            ))}
          </ul>

          {lessons.length > 0 ? (
            <div className="rounded-xl border border-brand/30 bg-brand/10 p-3">
              <p className="text-sm font-semibold text-brand mb-2">Next up</p>
              <div className="flex flex-wrap gap-2">
                {lessons.map((l) => (
                  <Link key={l.title} to={`/learn?topic=${l.topic}&lesson=${encodeURIComponent(l.title)}`}
                    className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg border border-brand/40 text-sm hover:bg-brand/10 transition-colors">
                    Review {l.title} <ArrowRight size={14} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand">No risk flags on this trade. Nice discipline.</p>
          )}
        </>
      )}
    </section>
  )
}