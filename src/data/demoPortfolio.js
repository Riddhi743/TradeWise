// sample data so the dashboard has something to show. Remove once real trading works (Phase 3).
export const demoPortfolio = {
  cash: 531200,
  holdings: [
    { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', qty: 50, avgPrice: 2800, stopLoss: 2650 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', qty: 30, avgPrice: 3700, stopLoss: 3500 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', qty: 100, avgPrice: 1600, stopLoss: null },
    { symbol: 'INFY', name: 'Infosys', sector: 'IT', qty: 40, avgPrice: 1550, stopLoss: 1450 },
  ],
  trades: [
    { id: 't1', symbol: 'RELIANCE', side: 'BUY', qty: 50, price: 2800, date: '2026-09-22' },
    { id: 't2', symbol: 'TCS', side: 'BUY', qty: 30, price: 3700, date: '2026-09-23' },
    { id: 't3', symbol: 'HDFCBANK', side: 'BUY', qty: 100, price: 1600, date: '2026-09-24' },
    { id: 't4', symbol: 'ITC', side: 'BUY', qty: 200, price: 420, date: '2026-09-25' },
    { id: 't5', symbol: 'ITC', side: 'SELL', qty: 200, price: 441, date: '2026-09-27', pnl: 4200 },
    { id: 't6', symbol: 'INFY', side: 'BUY', qty: 40, price: 1550, date: '2026-09-28' },
  ],
}