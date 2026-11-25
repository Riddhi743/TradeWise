import { inr } from '@/utils/format'

const L = {
  stop: { topic: 'portfolio', title: 'Stop-loss' },
  size: { topic: 'portfolio', title: 'Position sizing' },
  rr: { topic: 'portfolio', title: 'Risk-reward ratio' },
  div: { topic: 'portfolio', title: 'Diversification' },
}
const ok = (text) => ({ status: 'ok', text })
const info = (text) => ({ status: 'info', text })
const warn = (text, lesson) => ({ status: 'warn', text, lesson })

// summary and holding are the state BEFORE the order
export function reviewOrder({ order, summary, holding }) {
  const { side, qty, price, stopLoss, takeProfit, symbol, sector } = order
  const total = summary.totalValue
  const checks = []

  if (side === 'BUY') {
    const value = qty * price

    checks.push(stopLoss
      ? ok(`Stop-loss was defined at ${inr(stopLoss)}.`)
      : warn('No stop-loss was set, so the loss on this trade was not capped.', L.stop))

    if (stopLoss) {
      const risk = ((price - stopLoss) * qty / total) * 100
      checks.push(risk <= 2
        ? ok(`Risk per trade was ${risk.toFixed(1)}% of your portfolio, within the common 1–2% guideline.`)
        : warn(`Risk per trade was ${risk.toFixed(1)}% of your portfolio, above the common 1–2% guideline.`, L.size))
    }

    const exposure = (((holding?.value ?? 0) + value) / total) * 100
    checks.push(exposure > 25
      ? warn(`${symbol} is now ${exposure.toFixed(0)}% of your portfolio, which is a large single position.`, L.div)
      : ok(`${symbol} is ${exposure.toFixed(0)}% of your portfolio, a reasonable position size.`))

    const others = summary.rows.filter((r) => r.sector === sector && r.symbol !== symbol).reduce((s, r) => s + r.value, 0)
    const sectorPct = ((others + (holding?.value ?? 0) + value) / total) * 100
    if (others > 0 && sectorPct > 40) {
      checks.push(warn(`${sector} stocks are now ${sectorPct.toFixed(0)}% of your portfolio. Spreading across sectors reduces risk.`, L.div))
    }

    if (stopLoss && takeProfit) {
      const rr = (takeProfit - price) / (price - stopLoss)
      checks.push(rr >= 1.5
        ? ok(`Risk-reward was 1 : ${rr.toFixed(2)}, so potential profit is larger than potential loss.`)
        : warn(`Risk-reward was only 1 : ${rr.toFixed(2)}. Aim for at least 1 : 1.5 so wins outweigh losses.`, L.rr))
    } else if (!takeProfit) {
      checks.push(info('No take-profit was set. Planning your exit target in advance helps avoid emotional decisions.'))
    }
  } else {
    const pnl = (price - holding.avgPrice) * qty
    checks.push(pnl > 0 ? ok(`Closed with a profit of ${inr(pnl)}.`)
      : pnl < 0 ? info(`Closed at a loss of ${inr(-pnl)}. A loss is not a mistake if it followed your plan.`)
      : info('Closed at break-even.'))
    checks.push(holding.stopLoss
      ? ok('This position had a stop-loss defined.')
      : warn('This position never had a stop-loss.', L.stop))
    if (qty < holding.qty) checks.push(info(`Partial exit: ${holding.qty - qty} shares are still open.`))
  }

  const lessons = []
  checks.forEach((c) => {
    if (c.lesson && !lessons.some((l) => l.title === c.lesson.title)) lessons.push(c.lesson)
  })
  return { checks, lessons }
}