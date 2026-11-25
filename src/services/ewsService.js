import { api } from './api'

export const newsService = {
  getSentiment: (symbol) => api.get(`/news/${symbol}`),
}