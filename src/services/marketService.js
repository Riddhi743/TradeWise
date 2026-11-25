import { api } from './api'

export const marketService = {
  getStocks: () => api.get('/market/stocks'),
  getHistory: (symbol, days = 90) => api.get(`/market/history/${symbol}?days=${days}`),
  getIndicators: (symbol, days = 90) => api.get(`/market/indicators/${symbol}?days=${days}`),
}