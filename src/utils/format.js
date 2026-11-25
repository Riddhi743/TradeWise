export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
export const signedInr = (n) => (n >= 0 ? '+' : '−') + inr(Math.abs(n))
export const signedPct = (n) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%'