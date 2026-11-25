export const stocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', price: 2900 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', price: 3800 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', price: 1650 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', price: 1500 },
  { symbol: 'ITC', name: 'ITC', sector: 'FMCG', price: 440 },
]

// deterministic fake OHLCV history (replaced by real API in Phase 7)
export function makeHistory(symbol, days = 90) {
  const base = stocks.find((s) => s.symbol === symbol)?.price ?? 1000
  let seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  let price = base * 0.9
  const rows = Array.from({ length: days }, (_, i) => {
    const open = price
    const close = open * (1 + (rand() - 0.48) * 0.03)
    price = close
    return {
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().slice(0, 10),
      open, close,
      high: Math.max(open, close) * 1.01,
      low: Math.min(open, close) * 0.99,
      volume: Math.floor(1e6 + rand() * 5e6),
    }
  })
  // scale so the latest close equals the stock's listed price
  const k = base / rows[rows.length - 1].close
  return rows.map((r) => ({ ...r, open: r.open * k, close: r.close * k, high: r.high * k, low: r.low * k }))
}