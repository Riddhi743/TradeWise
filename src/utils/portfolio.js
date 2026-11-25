import { INITIAL_CAPITAL } from '@/data/portfolio'

export function summarize(portfolio, stocks) {
  const price = Object.fromEntries(stocks.map((s) => [s.symbol, s.price]))

  const rows = portfolio.holdings.map((h) => {
    const ltp = price[h.symbol] ?? h.avgPrice
    const cost = h.avgPrice * h.qty
    const value = ltp * h.qty
    return { ...h, ltp, cost, value, pnl: value - cost, pnlPct: cost ? ((value - cost) / cost) * 100 : 0 }
  })

  const invested = rows.reduce((s, r) => s + r.cost, 0)
  const marketValue = rows.reduce((s, r) => s + r.value, 0)
  const totalValue = portfolio.cash + marketValue
  const totalPnl = totalValue - INITIAL_CAPITAL

  return {
    rows, invested, marketValue, totalValue, totalPnl,
    unrealized: marketValue - invested,
    realized: portfolio.trades.reduce((s, t) => s + (t.pnl ?? 0), 0),
    returnPct: (totalPnl / INITIAL_CAPITAL) * 100,
    allocation: [
      ...rows.map((r) => ({ name: r.symbol, value: r.value })),
      { name: 'Cash', value: portfolio.cash },
    ],
  }
}