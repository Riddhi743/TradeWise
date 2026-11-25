import { api } from './api'

export const tradeService = {
  getPortfolio: () => api.get('/portfolio'),
  loadDemo: () => api.post('/portfolio/demo'),
  reset: () => api.post('/portfolio/reset'),

  placeOrder: async ({ symbol, side, qty, stopLoss, takeProfit, review }) => {
    qty = Math.floor(qty)
    if (!qty || qty < 1) throw new Error('Enter a quantity of at least 1')
    return api.post('/portfolio/orders', {
      symbol, side, qty,
      stopLoss: stopLoss ?? null,
      takeProfit: takeProfit ?? null,
      review: review ?? null,
    })
  },
}