import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion, AnimatePresence, useScroll, useSpring, useTransform,
  useMotionValue, useReducedMotion,
} from 'framer-motion'
import {
  GraduationCap, TrendingUp, ShieldCheck, ClipboardCheck, Sparkles, Target,
  ArrowRight, CheckCircle2, AlertTriangle, Menu, X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import './landing.css'
import InteractiveBg from './InteractiveBg'

const steps = [
  { n: '01', title: 'Learn', text: 'Take a quick assessment and start with the right module.' },
  { n: '02', title: 'Practice', text: 'Place virtual trades on historical market data.' },
  { n: '03', title: 'Review', text: 'See risk flags and feedback after every trade.' },
  { n: '04', title: 'Improve', text: 'Follow recommended lessons and track your progress.' },
]

const tickerItems = [
  { sym: 'NIFTY 50', price: '21,840.30', chg: '+0.82%', up: true },
  { sym: 'SENSEX', price: '72,031.20', chg: '+0.74%', up: true },
  { sym: 'BANKNIFTY', price: '46,124.55', chg: '-0.31%', up: false },
  { sym: 'RELIANCE', price: '2,914.80', chg: '+1.24%', up: true },
  { sym: 'TCS', price: '4,102.65', chg: '+0.56%', up: true },
  { sym: 'INFY', price: '1,631.40', chg: '-0.42%', up: false },
  { sym: 'HDFCBANK', price: '1,502.15', chg: '+0.91%', up: true },
  { sym: 'ICICIBANK', price: '945.70', chg: '+0.33%', up: true },
]

const ease = [0.22, 1, 0.36, 1]

/* ---------- small building blocks ---------- */

function Reveal({ children, delay = 0, y = 24, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

/** 3D tilt + cursor spotlight. Wrap any glass card in this. */
function Tilt({ children, className = '', max = 7 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), { stiffness: 220, damping: 20 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), { stiffness: 220, damping: 20 })

  const onMove = (e) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    x.set(px - 0.5)
    y.set(py - 0.5)
    ref.current.style.setProperty('--mx', `${px * 100}%`)
    ref.current.style.setProperty('--my', `${py * 100}%`)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`tilt ${className}`}
    >
      {children}
    </motion.div>
  )
}

function PrimaryBtn({ to, children, size = 'md', className = '' }) {
  const sz = size === 'lg' ? 'h-13 px-7 text-base' : 'h-10 px-5 text-sm'
  return (
    <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-flex">
      <Link
        to={to}
        className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold text-white whitespace-nowrap bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_10px_28px_-8px_rgba(5,150,105,.65)] hover:shadow-[0_14px_36px_-8px_rgba(5,150,105,.8)] transition-shadow ${sz} ${className}`}
      >
        <span className="shine" aria-hidden />
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.span>
  )
}

function GhostBtn({ to, href, children, size = 'md', className = '', onClick }) {
  const sz = size === 'lg' ? 'h-13 px-7 text-base' : 'h-10 px-5 text-sm'
  const cls = `glass inline-flex items-center justify-center gap-2 rounded-full font-semibold text-slate-800 whitespace-nowrap hover:bg-white/80 transition-colors ${sz} ${className}`
  return (
    <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-flex">
      {to ? <Link to={to} onClick={onClick} className={cls}>{children}</Link> : <a href={href} onClick={onClick} className={cls}>{children}</a>}
    </motion.span>
  )
}

function Logo() {
  return (
    <Link to="/" aria-label="TradeWise home" className="inline-flex items-center gap-2.5">
      <span className="size-9 grid place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_6px_16px_-4px_rgba(5,150,105,.6)]">
        <TrendingUp size={19} className="text-white" aria-hidden />
      </span>
      <span className="font-extrabold text-lg tracking-tight text-slate-900">
        Trade<span className="grad-text">Wise</span>
      </span>
    </Link>
  )
}

function IconTile({ icon: Icon }) {
  return (
    <div className="size-11 grid place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 ring-1 ring-white shadow-sm shrink-0">
      <Icon size={22} aria-hidden />
    </div>
  )
}

/* ---------- ticker ---------- */

function Ticker() {
  return (
    <div className="relative z-20 overflow-hidden border-b border-white/70 bg-white/50 backdrop-blur-md">
      <div className="lp-marquee gap-10 py-2.5 pr-10 whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px] font-mono">
            <span className="font-semibold text-slate-500">{t.sym}</span>
            <span className="text-slate-900">{t.price}</span>
            <span className={t.up ? 'text-emerald-600' : 'text-rose-500'}>{t.up ? '▲' : '▼'} {t.chg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- polished gradient chart ---------- */

const smooth = (pts) => {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

function MiniChart({ className = '' }) {
  const id = useId().replace(/:/g, '')
  const data = [40, 38, 42, 35, 48, 44, 52, 49, 58, 55, 62, 60, 68]
  const W = 300
  const H = 120
  const min = Math.min(...data)
  const range = Math.max(...data) - min || 1
  const pts = data.map((v, i) => [(i * W) / (data.length - 1), 104 - ((v - min) / range) * 84])
  const line = smooth(pts)
  const area = `${line} L ${W} ${H} L 0 ${H} Z`
  const last = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full h-auto overflow-visible ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="60%" stopColor="#0ea5a4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {[30, 60, 90].map((y) => (
        <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="#0b1b2e" strokeOpacity="0.07" strokeDasharray="3 5" />
      ))}
      <motion.path
        d={area} fill={`url(#${id}f)`}
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />
      <motion.path
        d={line} fill="none" stroke={`url(#${id}s)`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
      <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.5 }}>
        <circle cx={last[0]} cy={last[1]} r="9" fill="#3b82f6" opacity="0.18">
          <animate attributeName="r" values="5;12;5" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={last[0]} cy={last[1]} r="4.5" fill="#fff" stroke="#3b82f6" strokeWidth="2.5" />
      </motion.g>
    </svg>
  )
}

/* ---------- hero review card ---------- */

function ReviewCard() {
  return (
    <div className="glass-strong glow-border rounded-3xl p-6" role="img" aria-label="Example trade review card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] tracking-widest text-slate-500 font-mono">TRADE REVIEW</p>
          <p className="font-bold text-xl text-slate-900">XYZ Ltd</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 font-bold font-mono">+₹3,000</span>
      </div>
      <MiniChart className="mb-4" />
      <dl className="grid grid-cols-3 gap-3 text-sm mb-4">
        {[['Entry', '₹500'], ['Exit', '₹530'], ['Qty', '100']].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/70 ring-1 ring-white p-3">
            <dt className="text-slate-500 text-xs">{k}</dt>
            <dd className="font-semibold font-mono text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="space-y-2 text-sm text-slate-700 mb-4">
        <li className="flex gap-2"><CheckCircle2 size={18} className="text-emerald-500 shrink-0" aria-hidden /> Stop-loss was defined</li>
        <li className="flex gap-2"><AlertTriangle size={18} className="text-amber-500 shrink-0" aria-hidden /> Position size was relatively large</li>
        <li className="flex gap-2"><AlertTriangle size={18} className="text-amber-500 shrink-0" aria-hidden /> Portfolio exposure rose sharply</li>
      </ul>
      <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 ring-1 ring-emerald-500/20 p-3 text-sm text-slate-800">
        <span className="font-semibold text-emerald-700">Next up:</span> Review Position Sizing
      </div>
    </div>
  )
}

function FloatChip({ className, delay = 0, children }) {
  return (
    <motion.div
      className={`glass absolute hidden sm:flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 ${className}`}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/* ---------- page ---------- */

export default function Landing() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // the rest of the app is dark; keep overscroll/edges light only on this page
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#f3f6fb'
    return () => { document.body.style.background = prev }
  }, [])

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  const heroRef = useRef(null)
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const cardY = useTransform(heroP, [0, 1], [0, 90])
  const textY = useTransform(heroP, [0, 1], [0, 40])

  const headline = ['Learn', 'to', 'trade', 'without', 'risking', 'a']
  const cta = user ? '/dashboard' : '/register'

  return (
    <div className="lp">
      {/* aurora */}
      <div className="aurora" aria-hidden><i /><i /><i /><i /></div>
      <InteractiveBg />
      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 z-50 h-[3px] origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
        aria-hidden
      />

      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>

      <div className="relative z-10">
        <Ticker />

        {/* floating glass nav */}
        <header className="sticky top-3 z-40 px-4 mt-3">
          <div className="glass mx-auto max-w-5xl rounded-full">
            <div className="flex h-14 items-center justify-between pl-4 pr-2.5">
              <Logo />
              <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600" aria-label="Main">
                <a href="#features" className="nav-link hover:text-slate-900 transition-colors">Features</a>
                <a href="#how" className="nav-link hover:text-slate-900 transition-colors">How it works</a>
              </nav>
              <div className="flex items-center gap-2">
                {user ? (
                  <PrimaryBtn to="/dashboard">Open dashboard</PrimaryBtn>
                ) : (
                  <>
                    <GhostBtn to="/login" className="hidden sm:inline-flex">Log in</GhostBtn>
                    <PrimaryBtn to="/register" className="hidden sm:inline-flex">Get started</PrimaryBtn>
                  </>
                )}
                <button
                  className="md:hidden size-10 grid place-items-center rounded-full text-slate-800 hover:bg-white/70 transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="glass-strong md:hidden mx-auto mt-2 max-w-5xl rounded-3xl p-4"
              >
                <div className="flex flex-col gap-1 text-slate-700">
                  <a href="#features" className="rounded-xl px-3 py-2.5 hover:bg-white/70" onClick={() => setMenuOpen(false)}>Features</a>
                  <a href="#how" className="rounded-xl px-3 py-2.5 hover:bg-white/70" onClick={() => setMenuOpen(false)}>How it works</a>
                  {!user && (
                    <div className="mt-2 flex flex-col gap-2 border-t border-white/80 pt-3">
                      <GhostBtn to="/login" className="w-full" onClick={() => setMenuOpen(false)}>Log in</GhostBtn>
                      <PrimaryBtn to="/register" className="w-full" onClick={() => setMenuOpen(false)}>Get started</PrimaryBtn>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main id="main">
          {/* Hero */}
          <section ref={heroRef} className="relative">
            <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 md:py-24 lg:grid-cols-2">
              <motion.div style={{ y: textY }}>
                <motion.p
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
                  className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600"
                >
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  Paper trading + AI tutoring for beginners
                </motion.p>

                <h1 className="text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-slate-900 md:text-[3.9rem]">
                  {headline.map((w, i) => (
                    <motion.span
                      key={i}
                      className="mr-[0.25em] inline-block"
                      initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease }}
                    >
                      {w}
                    </motion.span>
                  ))}
                  <motion.span
                    className="lp-serif grad-text inline-block pr-1 text-[1.12em] italic"
                    initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, delay: 0.1 + headline.length * 0.07, ease }}
                  >
                    rupee.
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7, ease }}
                  className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
                >
                  TradeWise combines lessons, virtual trading and personalized feedback, so you understand why a trade worked or failed, not just the profit or loss.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.85, ease }}
                  className="mt-8 flex flex-wrap gap-3"
                >
                  <PrimaryBtn to={cta} size="lg">Start learning free <ArrowRight size={18} aria-hidden /></PrimaryBtn>
                  <GhostBtn href="#how" size="lg">See how it works</GhostBtn>
                </motion.div>

                <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
                  {[['₹10L', 'virtual capital'], ['5', 'learning modules'], ['6', 'indicators']].map(([v, l], i) => (
                    <motion.div
                      key={l}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 + i * 0.1, ease }}
                      whileHover={{ y: -3 }}
                      className="glass rounded-2xl px-4 py-3"
                    >
                      <dd className="font-mono text-xl font-bold text-slate-900">{v}</dd>
                      <dt className="text-[11px] text-slate-500">{l}</dt>
                    </motion.div>
                  ))}
                </dl>
              </motion.div>

              <motion.div style={{ y: cardY }} className="relative mx-auto w-full max-w-md">
                <motion.div initial={{ opacity: 0, x: 40, rotate: 2 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: 0.9, delay: 0.3, ease }}>
                  <Tilt max={9}><ReviewCard /></Tilt>
                </motion.div>
                <FloatChip className="-left-10 top-12" delay={0}>
                  <ShieldCheck size={16} className="text-emerald-500" aria-hidden /> Risk: Moderate
                </FloatChip>
                <FloatChip className="-right-6 bottom-20" delay={1.2}>
                  <TrendingUp size={16} className="text-sky-500" aria-hidden /> +1.24% today
                </FloatChip>
              </motion.div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
            <Reveal>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Features</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Everything a beginner <span className="lp-serif italic">needs</span>
              </h2>
              <p className="mb-12 mt-3 max-w-2xl text-slate-600">Education, practice and feedback in one place instead of three separate tools.</p>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Structured learning */}
              <Reveal className="md:col-span-2" delay={0}>
                <Tilt className="glass glow-border glow-hover h-full rounded-3xl p-7">
                  <div className="flex items-start gap-4">
                    <IconTile icon={GraduationCap} />
                    <div>
                      <h3 className="mb-1 font-bold text-slate-900">Structured learning</h3>
                      <p className="text-sm text-slate-600">Five modules from market basics to portfolio management, each with short quizzes.</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      { label: 'Market Basics', pct: 100 },
                      { label: 'Technical Analysis', pct: 100 },
                      { label: 'Risk Management', pct: 60 },
                      { label: 'Portfolio Strategy', pct: 0 },
                      { label: 'Psychology & Discipline', pct: 0 },
                    ].map((m, i) => (
                      <div key={m.label} className="flex items-center gap-3">
                        <span className="hidden w-40 shrink-0 text-xs font-medium text-slate-600 sm:inline">{m.label}</span>
                        <span className="w-20 truncate text-xs font-medium text-slate-600 sm:hidden">{m.label.split(' ')[0]}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900/5">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500"
                            initial={{ width: 0 }} whileInView={{ width: `${m.pct}%` }} viewport={{ once: true }}
                            transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease }}
                          />
                        </div>
                        <span className="w-9 text-right font-mono text-xs text-slate-500">{m.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Tilt>
              </Reveal>

              {/* Virtual trading */}
              <Reveal className="md:row-span-2" delay={0.1}>
                <Tilt className="glass glow-border glow-hover flex h-full flex-col rounded-3xl p-7">
                  <div className="flex items-start gap-4">
                    <IconTile icon={TrendingUp} />
                    <div>
                      <h3 className="mb-1 font-bold text-slate-900">Virtual trading</h3>
                      <p className="text-sm text-slate-600">Buy and sell with ₹10L of simulated money.</p>
                    </div>
                  </div>
                  <div className="mt-8 flex flex-1 flex-col justify-center">
                    <p className="mb-1 font-mono text-[11px] tracking-widest text-slate-500">PORTFOLIO VALUE</p>
                    <p className="font-mono text-3xl font-bold text-slate-900">₹10,12,450</p>
                    <p className="mt-1 font-mono text-sm text-emerald-600">+₹12,450 (+1.24%)</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">Stop-loss</span>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">Take-profit</span>
                      <span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-xs text-slate-500">Market order</span>
                    </div>
                  </div>
                  <div className="mt-6"><MiniChart /></div>
                </Tilt>
              </Reveal>

              {/* Risk */}
              <Reveal delay={0.15}>
                <Tilt className="glass glow-border glow-hover h-full rounded-3xl p-7">
                  <div className="flex items-start gap-4">
                    <IconTile icon={ShieldCheck} />
                    <div>
                      <h3 className="mb-1 font-bold text-slate-900">Risk-first mindset</h3>
                      <p className="text-sm text-slate-600">Position sizing, risk-reward, diversification.</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Risk level</span>
                      <span className="font-semibold text-amber-600">Moderate</span>
                    </div>
                    <div className="relative h-2.5 rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400">
                      <motion.div
                        className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-amber-400 shadow-lg"
                        initial={{ left: '4%' }} whileInView={{ left: '42%' }} viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.4, ease }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
                      <span>Safe</span><span>Moderate</span><span>High</span>
                    </div>
                  </div>
                </Tilt>
              </Reveal>

              {/* Reviews */}
              <Reveal delay={0.2}>
                <Tilt className="glass glow-border glow-hover h-full rounded-3xl p-7">
                  <div className="flex items-start gap-4">
                    <IconTile icon={ClipboardCheck} />
                    <div>
                      <h3 className="mb-1 font-bold text-slate-900">Trade reviews</h3>
                      <p className="text-sm text-slate-600">Feedback after every trade.</p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="shrink-0 text-emerald-500" /> Stop-loss defined</li>
                    <li className="flex items-center gap-2"><AlertTriangle size={15} className="shrink-0 text-amber-500" /> Large position size</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={15} className="shrink-0 text-emerald-500" /> Good risk-reward</li>
                  </ul>
                </Tilt>
              </Reveal>

              {/* AI tutor */}
              <Reveal className="md:col-span-2" delay={0.25}>
                <Tilt className="glass glow-border glow-hover h-full rounded-3xl p-7">
                  <div className="flex items-start gap-4">
                    <IconTile icon={Sparkles} />
                    <div>
                      <h3 className="mb-1 font-bold text-slate-900">AI tutor</h3>
                      <p className="text-sm text-slate-600">Ask questions and get explanations grounded in course material and your trade history.</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-600 shadow-sm">Y</div>
                      <div className="max-w-md rounded-2xl rounded-tl-sm bg-white/80 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm">Why did my XYZ trade lose money?</div>
                    </div>
                    <div className="flex items-start justify-end gap-2">
                      <div className="max-w-md rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-500/10 to-sky-500/10 px-3.5 py-2.5 text-sm text-slate-700 ring-1 ring-emerald-500/20">
                        Your entry was fine, but you sized the position at 40% of your portfolio, well above the 15% ceiling from Module 3. When the stock dropped 5%, the loss amplified. Review Position Sizing next.
                      </div>
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white"><Sparkles size={13} /></div>
                    </div>
                  </div>
                </Tilt>
              </Reveal>

              {/* Path */}
              <Reveal delay={0.3}>
                <Tilt className="glass glow-border glow-hover h-full rounded-3xl p-7">
                  <div className="flex items-start gap-4">
                    <IconTile icon={Target} />
                    <div>
                      <h3 className="mb-1 font-bold text-slate-900">Personalized path</h3>
                      <p className="text-sm text-slate-600">Repeated mistakes point you to the right lesson.</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5">
                    <div className="size-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                    <div className="h-0.5 flex-1 bg-emerald-500" />
                    <div className="size-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                    <div className="h-0.5 flex-1 bg-slate-300" />
                    <div className="size-3 rounded-full border-2 border-slate-300 bg-white" />
                    <div className="h-0.5 flex-1 bg-slate-300" />
                    <div className="size-3 rounded-full border-2 border-slate-300 bg-white" />
                  </div>
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 px-3 py-2 text-xs text-slate-800 ring-1 ring-emerald-500/20">
                    <span className="font-semibold text-emerald-700">Recommended:</span> Position Sizing
                  </div>
                </Tilt>
              </Reveal>
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
            <Reveal>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">How it works</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                A loop that builds <span className="lp-serif italic">discipline</span>
              </h2>
              <p className="mb-14 mt-3 max-w-2xl text-slate-600">Each cycle makes you a sharper, more disciplined trader, not just a richer one.</p>
            </Reveal>

            <div className="relative">
              <motion.div
                className="absolute left-0 right-0 top-[34px] hidden h-px origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-transparent lg:block"
                initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease }}
                aria-hidden
              />
              <ol className="grid gap-5 lg:grid-cols-4">
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 0.12}>
                    <li className="list-none">
                      <Tilt className="glass glow-border glow-hover rounded-3xl p-6" max={6}>
                        <div className="mb-4 grid size-[52px] place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 font-mono text-lg font-bold text-white shadow-[0_8px_20px_-6px_rgba(5,150,105,.6)]">
                          {s.n}
                        </div>
                        <h3 className="mb-1 text-lg font-bold text-slate-900">{s.title}</h3>
                        <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
                      </Tilt>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>

            <Reveal delay={0.4} className="mt-10">
              <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-600">
                <ArrowRight size={16} className="text-emerald-500" aria-hidden />
                Then repeat. Each loop tightens your instincts.
              </div>
            </Reveal>
          </section>

          {/* CTA */}
          <section className="mx-auto max-w-6xl px-6 py-16">
            <Reveal y={36}>
              <div className="glass-strong glow-border relative overflow-hidden rounded-[2rem]">
                <div className="grid md:grid-cols-2">
                  <div className="flex flex-col justify-center p-10 md:p-14">
                    <div className="mb-5 inline-flex items-center gap-2">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-500">Free to start</span>
                    </div>
                    <h2 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
                      Make your first mistakes where they're <span className="lp-serif grad-text italic">free</span>.
                    </h2>
                    <p className="mb-8 max-w-md text-lg text-slate-600">No real money. No tips. Just practice, feedback, and a loop that actually makes you better.</p>
                    <div className="flex flex-wrap gap-3">
                      <PrimaryBtn to={cta} size="lg">Create free account <ArrowRight size={18} aria-hidden /></PrimaryBtn>
                      <GhostBtn to={user ? '/dashboard' : '/login'} size="lg">I already have one</GhostBtn>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-4 border-t border-white/70 bg-gradient-to-br from-emerald-100/50 via-sky-100/40 to-violet-100/50 p-10 md:border-l md:border-t-0 md:p-14">
                    <div className="space-y-3.5">
                      {['₹10 lakh virtual capital', '5 structured learning modules', 'AI tutor with trade context', 'Personalized lesson recommendations'].map((t, i) => (
                        <motion.div
                          key={t}
                          initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease }}
                          className="glass flex items-center gap-3 rounded-2xl px-4 py-3"
                        >
                          <CheckCircle2 size={20} className="shrink-0 text-emerald-500" aria-hidden />
                          <span className="text-sm font-medium text-slate-800">{t}</span>
                        </motion.div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">No credit card. No real money. Cancel anytime.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-8 border-t border-white/70 bg-white/40 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Logo />
                <p className="mt-4 max-w-xs text-sm text-slate-600">A stock tutoring platform that teaches you to trade through practice, not tips.</p>
                <p className="mt-4 text-xs text-slate-500">Educational simulation only. Not investment advice. No real money involved.</p>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-900">Platform</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#features" className="transition-colors hover:text-slate-900">Features</a></li>
                  <li><a href="#how" className="transition-colors hover:text-slate-900">How it works</a></li>
                  <li><Link to="/register" className="transition-colors hover:text-slate-900">Get started</Link></li>
                  <li><Link to="/login" className="transition-colors hover:text-slate-900">Log in</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-bold text-slate-900">Learn</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>Market Basics</li><li>Technical Analysis</li><li>Risk Management</li><li>Portfolio Strategy</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/80 pt-6 text-xs text-slate-500 sm:flex-row">
              <p>© 2026 TradeWise. All rights reserved.</p>
              <p>Built for learners. Not affiliated with any broker or exchange.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}