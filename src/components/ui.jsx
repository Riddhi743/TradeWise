import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Loader2, Eye, EyeOff } from 'lucide-react'

const base =
  'btn-core inline-flex items-center justify-center gap-2 font-semibold rounded-full cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const variants = {
  primary: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_10px_26px_-8px_rgba(5,150,105,.6)] hover:shadow-[0_14px_32px_-8px_rgba(5,150,105,.8)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  ghost: 'border border-white/80 bg-white/60 backdrop-blur-md text-ink shadow-sm hover:bg-white/90 hover:border-brand/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
}

const sizes = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

export const btn = (variant = 'primary', size = 'md') => `${base} ${variants[variant]} ${sizes[size]}`

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }) {
  return (
    <button className={`${btn(variant, size)} ${className}`} {...props} disabled={loading || props.disabled}>
      {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Logo({ className = '' }) {
  return (
    <Link to="/" aria-label="TradeWise home" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="size-9 grid place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_6px_16px_-4px_rgba(5,150,105,.6)]">
        <TrendingUp size={19} className="text-white" aria-hidden />
      </span>
      <span className="font-extrabold text-lg tracking-tight">
        Trade<span className="grad-text">Wise</span>
      </span>
    </Link>
  )
}

export function Field({ label, id, error, hint, type = 'text', ...props }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPw && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`w-full min-h-11 px-3.5 rounded-xl bg-white/70 border transition-all duration-200 placeholder:text-muted/70 focus:border-brand/60 focus:bg-white focus:ring-4 focus:ring-brand/10 ${error ? 'border-danger' : 'border-line'} ${isPw ? 'pr-11' : ''}`}
          {...props}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-0 top-0 size-11 grid place-items-center text-muted hover:text-ink cursor-pointer"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}