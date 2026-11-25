import { motion } from 'framer-motion'
import { Activity, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from './ui'

const points = [
  { icon: Activity, text: '₹10,00,000 in virtual capital to practice with' },
  { icon: ShieldCheck, text: 'Risk checks on every trade you place' },
  { icon: Sparkles, text: 'An AI tutor that explains your mistakes' },
]

const ease = [0.22, 1, 0.36, 1]

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 gap-4 p-4">
      <aside className="glass-strong hidden lg:flex flex-col justify-between rounded-3xl p-12">
        <Logo />
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}
            className="text-5xl font-extrabold leading-[1.05] tracking-tight mb-10"
          >
            Practice the market.<br />
            <span className="lp-serif grad-text italic text-[1.1em]">Keep your money.</span>
          </motion.h2>
          <ul className="space-y-3">
            {points.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease }}
                className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-brand ring-1 ring-white">
                  <Icon size={18} aria-hidden />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted">Educational simulation only. Not investment advice.</p>
      </aside>

      <main className="flex items-center justify-center p-2 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.1, ease }}
          className="glass-strong glow-border w-full max-w-md rounded-3xl p-8 sm:p-10"
        >
          <Logo className="lg:hidden mb-8" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{title}</h1>
          <p className="text-muted mb-8">{subtitle}</p>
          {children}
          <p className="text-sm text-muted mt-6 text-center">{footer}</p>
        </motion.div>
      </main>
    </div>
  )
}