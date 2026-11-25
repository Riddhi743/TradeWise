import { INITIAL_CAPITAL } from '@/data/portfolio'

function equityCurve(trades, histories, currentValue) {
  const syms = Object.keys(histories)
  if (!trades.length || !syms.length) return [currentValue]
  const ordered = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  const dates = histories[syms[0]].map((h) => h.date).filter((d) => d >= ordered[0].date)

  let cash = INITIAL_CAPITAL
  const qty = {}
  let k = 0
  const curve = []

  dates.forEach((d) => {
    while (k < ordered.length && ordered[k].date <= d) {
      const t = ordered[k++]
      const sign = t.side === 'BUY' ? 1 : -1
      cash -= sign * t.qty * t.price
      qty[t.symbol] = (qty[t.symbol] ?? 0) + sign * t.qty
    }
    let v = cash
    Object.entries(qty).forEach(([sym, n]) => {
      if (!n) return
      const h = histories[sym]
      v += n * (h?.find((x) => x.date === d)?.close ?? h?.at(-1)?.close ?? 0)
    })
    curve.push(v)
  })
  curve.push(currentValue)
  return curve
}

export function portfolioRisk(summary, trades, histories) {
  const total = summary.totalValue || 1
  const rows = [...summary.rows].sort((a, b) => b.value - a.value)
  if (!rows.length) return null

  const bySector = {}
  rows.forEach((r) => { bySector[r.sector] = (bySector[r.sector] || 0) + r.value })
  const sectors = Object.entries(bySector)
    .map(([name, v]) => ({ name, pct: (v / total) * 100 }))
    .sort((a, b) => b.pct - a.pct)

  const top = { symbol: rows[0].symbol, pct: (rows[0].value / total) * 100 }
  const diversification =
    top.pct > 40 || sectors.length < 2 ? 'Concentrated'
      : top.pct > 25 || sectors.length < 3 ? 'Moderate'
        : 'Diversified'

  const protectedRows = rows.filter((r) => r.stopLoss)
  const unprotectedRows = rows.filter((r) => !r.stopLoss)
  const lossIfStopped = protectedRows.reduce((s, r) => s + Math.max(r.ltp - r.stopLoss, 0) * r.qty, 0)

  const curve = equityCurve(trades, histories, summary.totalValue)
  let peak = curve[0]
  let mdd = 0
  curve.forEach((v) => {
    peak = Math.max(peak, v)
    mdd = Math.min(mdd, ((v - peak) / peak) * 100)
  })

  return {
    top, sectors, diversification,
    lossIfStopped, lossIfStoppedPct: (lossIfStopped / total) * 100,
    unprotectedValue: unprotectedRows.reduce((s, r) => s + r.value, 0),
    unprotectedCount: unprotectedRows.length,
    maxDrawdown: Math.abs(mdd),
  }
}