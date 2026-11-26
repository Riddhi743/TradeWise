import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button, Field } from '@/components/ui'
import { positionSize, riskReward } from '@/utils/risk'
import { inr } from '@/utils/format'

function UnitToggle({ unit, onChange }) {
  return (
    <div role="group" aria-label="Stop-loss and take-profit unit" className="inline-flex rounded-lg border border-line overflow-hidden text-xs">
      {[['pct', '%'], ['inr', '₹']].map(([u, t]) => (
        <button key={u} type="button" aria-pressed={unit === u} onClick={() => onChange(u)}
          className={`px-3 min-h-8 cursor-pointer transition-colors ${unit === u ? 'bg-brand text-bg font-semibold' : 'text-muted hover:bg-surface-2'}`}>
          {t}
        </button>
      ))}
    </div>
  )
}

export default function OrderForm({ stock, cash, totalValue, holding, onSubmit }) {
  const [side, setSide] = useState('BUY')
  const [qty, setQty] = useState('')
  const [stop, setStop] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('pct')
  const [riskPct, setRiskPct] = useState(1)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const { symbol, name, sector, price } = stock
  const buy = side === 'BUY'
  const q = Math.floor(Number(qty)) || 0

  const toPrice = (raw, dir) => {
    const n = Number(raw) || 0
    if (!n) return 0
    return unit === 'pct' ? Math.round(price * (1 + (dir * n) / 100) * 100) / 100 : n
  }
  const sl = toPrice(stop, -1)
  const tp = toPrice(target, 1)

  const value = q * price
  const slValid = sl > 0 && sl < price
  const maxRisk = (totalValue * riskPct) / 100
  const suggested = slValid ? Math.min(positionSize(totalValue, riskPct, price, sl), Math.floor(cash / price)) : 0
  const rr = slValid && tp > price ? riskReward(price, sl, tp) : 0
  const lossIfStopped = slValid ? q * (price - sl) : 0
  const exposure = totalValue ? ((value + (holding?.value ?? 0)) / totalValue) * 100 : 0
  const stopHint = unit === 'pct'
    ? (sl > 0 ? `= ${inr(sl)}` : undefined)
    : (slValid ? `${((1 - sl / price) * 100).toFixed(1)}% below price` : undefined)
  const targetHint = unit === 'pct'
    ? (tp > 0 ? `= ${inr(tp)}` : undefined)
    : (tp > price ? `${((tp / price - 1) * 100).toFixed(1)}% above price` : undefined)

  const warnings = []
  if (buy && q > 0) {
    if (!slValid) warnings.push('No stop-loss set, so the loss on this trade is not capped.')
    else if ((lossIfStopped / totalValue) * 100 > 2) warnings.push(`This trade risks ${((lossIfStopped / totalValue) * 100).toFixed(1)}% of your portfolio. Many beginners keep risk to 1–2% per trade.`)
    if (exposure > 25) warnings.push(`This stock would be ${exposure.toFixed(0)}% of your portfolio. A large single position reduces diversification.`)
  }
  const changeUnit = (next) => {
    if (next === unit) return
    const r = (x) => String(Math.round(x * 100) / 100)
    const flip = (raw, dir) => {
      const n = Number(raw)
      if (!n) return ''
      return unit === 'pct' ? r(price * (1 + (dir * n) / 100)) : r(dir * (n / price - 1) * 100)
    }
    setStop(flip(stop, -1))
    setTarget(flip(target, 1))
    setUnit(next)
  }
  
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (q < 1) return setError('Enter a quantity of at least 1')
    
    if (buy && stop && !slValid) return setError(unit === 'pct' ? 'Stop-loss % must be above 0 and below 100' : 'Stop-loss must be below the buy price')
    if (buy && target && tp <= price) return setError(unit === 'pct' ? 'Take-profit % must be above 0' : 'Take-profit must be above the buy price')
      setBusy(true)
    try {
      await onSubmit({ symbol, name, sector, side, qty: q, price, stopLoss: buy && sl ? sl : null, takeProfit: buy && tp ? tp : null })
      setQty(''); setStop(''); setTarget('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const sideBtn = (s) =>
    `flex-1 min-h-11 rounded-xl text-sm font-semibold cursor-pointer transition-colors ${side === s ? (s === 'BUY' ? 'bg-brand text-bg' : 'bg-danger text-bg') : 'border border-line text-muted hover:bg-surface-2'}`

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold mb-1">{symbol}</h2>
      <p className="text-2xl font-bold font-mono mb-4">{inr(price)}</p>

      <div className="flex gap-2 mb-4">
        <button type="button" aria-pressed={buy} onClick={() => setSide('BUY')} className={sideBtn('BUY')}>Buy</button>
        <button type="button" aria-pressed={!buy} onClick={() => setSide('SELL')} className={sideBtn('SELL')}>Sell</button>
      </div>

      <Field label="Quantity" id="qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
        hint={!buy ? `You hold ${holding?.qty ?? 0} shares` : `Cash available: ${inr(cash)}`} />

      {buy && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Enter stop-loss and take-profit as</span>
            <UnitToggle unit={unit} onChange={changeUnit} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Stop-loss (${unit === 'pct' ? '%' : '₹'})`} id="sl" type="number" step="any" value={stop}
              onChange={(e) => setStop(e.target.value)} placeholder={unit === 'pct' ? '% below price' : 'Below price'} hint={stopHint} />
            <Field label={`Take-profit (${unit === 'pct' ? '%' : '₹'})`} id="tp" type="number" step="any" value={target}
              onChange={(e) => setTarget(e.target.value)} placeholder={unit === 'pct' ? '% above price' : 'Above price'} hint={targetHint} />
          </div>

          <div className="rounded-xl bg-surface-2 p-3 mb-4 text-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="risk" className="font-medium">Position size calculator</label>
              <select id="risk" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} className="bg-surface border border-line rounded-lg px-2 min-h-9 text-xs">
                {[0.5, 1, 2].map((r) => <option key={r} value={r}>Risk {r}%</option>)}
              </select>
            </div>
            {slValid ? (
              <>
                <p className="text-xs text-muted font-mono mb-2">
                  {inr(maxRisk)} ÷ ({inr(price)} − {inr(sl)}) = {Math.floor(maxRisk / (price - sl))} shares
                </p>
                <button type="button" onClick={() => setQty(String(suggested))} disabled={suggested < 1} className="text-brand text-sm font-medium cursor-pointer hover:underline disabled:opacity-50">
                  Use {suggested} shares
                </button>
              </>
            ) : (
              <p className="text-xs text-muted">Enter a stop-loss to see how many shares keep your risk at {riskPct}% of your portfolio.</p>
            )}
          </div>
        </>
      )}

      {q > 0 && (
        <dl className="text-sm space-y-1.5 mb-4 font-mono">
          <div className="flex justify-between"><dt className="text-muted font-sans">Order value</dt><dd>{inr(value)}</dd></div>
          {buy && slValid && <div className="flex justify-between"><dt className="text-muted font-sans">Loss if stop-loss hits</dt><dd className="text-danger">{inr(lossIfStopped)}</dd></div>}
          {buy && rr > 0 && <div className="flex justify-between"><dt className="text-muted font-sans">Risk-reward</dt><dd>1 : {rr.toFixed(2)}</dd></div>}
        </dl>
      )}

      {warnings.map((w) => (
        <p key={w} className="flex gap-2 text-xs rounded-lg border border-warn/30 bg-warn/10 p-3 mb-3">
          <AlertTriangle size={16} className="text-warn shrink-0" aria-hidden /> {w}
        </p>
      ))}
      {error && <p role="alert" className="text-sm text-danger mb-3">{error}</p>}

      <Button loading={busy} className="w-full">{buy ? 'Place buy order' : 'Place sell order'}</Button>
      <p className="text-xs text-muted mt-3 text-center">Virtual money only. Orders fill instantly at the listed price.</p>
    </form>
  )
}