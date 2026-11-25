// Position Size = Max Acceptable Loss / (Entry - Stop Loss)
export function positionSize(capital, riskPct, entry, stopLoss) {
  const perShare = entry - stopLoss
  if (perShare <= 0) return 0
  return Math.floor((capital * riskPct / 100) / perShare)
}

// Risk-Reward = Potential Profit / Potential Loss
export function riskReward(entry, stopLoss, target) {
  const risk = entry - stopLoss
  return risk > 0 ? (target - entry) / risk : 0
}
