import { useEffect, useState } from 'react'
import { newsService } from '../services/newsService'

const COLORS = {
  positive: 'text-green-400 bg-green-400/10 border-green-400/30',
  neutral: 'text-gray-300 bg-gray-400/10 border-gray-400/30',
  negative: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export default function SentimentWidget({ symbol }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    newsService
      .getSentiment(symbol)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message || 'Failed to load news'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [symbol])

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">Market Sentiment · {symbol}</h3>
        {data && (
          <span className="text-xs px-2 py-1 rounded-full border border-white/20 text-gray-200">
            {data.summary.mood}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Reading the news…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {data && (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {data.summary.total} headlines: {data.summary.positive} positive,{' '}
            {data.summary.neutral} neutral, {data.summary.negative} negative
          </p>
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.articles.map((a, i) => (
              <li key={i} className="text-sm">
                <a
                  href={a.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-100 hover:underline"
                >
                  {a.title}
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${COLORS[a.label]}`}>
                    {a.label} · {Math.round(a.score * 100)}%
                  </span>
                  {a.source && <span className="text-[11px] text-gray-500">{a.source}</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-500 mt-3">{data.disclaimer}</p>
        </>
      )}
    </div>
  )
}