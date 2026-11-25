import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { CandlestickChart, CheckCircle2, ChevronDown, Clock, Compass, PieChart, Search, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { learningService } from '@/services/learningService'
import { btn } from '@/components/ui'

const panel = 'rounded-2xl border border-line bg-surface p-5'
const icons = { foundations: Compass, fundamental: Search, technical: CandlestickChart, portfolio: PieChart }

export default function Learn() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(() => ({
    [learningService.nextLesson(user?.assessment)?.topic ?? 'foundations']: true,
  }))

  // deep link from trade reviews: /learn?topic=portfolio&lesson=Stop-loss
  const title = params.get('lesson')
  const linked = title ? learningService.findLesson(title) : null
  if (linked) return <Navigate to={`/learn/${linked.id}`} replace />

  const progress = learningService.getProgress()
  const assessment = user?.assessment
  const next = learningService.nextLesson(assessment)
  const st = learningService.stats()
  const rec = assessment?.weakTopics?.length ? assessment.recommended : null
  const mods = learningService.getModules()
  const allOpen = mods.every((m) => open[m.id])
  const toggleAll = () => setOpen(Object.fromEntries(mods.map((m) => [m.id, !allOpen])))
  const nextRank = st.ranks[st.modsDone + 1]

  return (
    <div className="max-w-4xl">
      <section className={`${panel} mb-6`} aria-label="Your journey">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted font-mono mb-1">YOUR MARKET JOURNEY</p>
            <h1 className="text-2xl md:text-3xl font-bold">{st.rank}</h1>
            <p className="text-sm text-muted mt-1">Level {st.level} · {st.xp} XP</p>
          </div>
          {next ? (
            <Link to={`/learn/${next.id}`} className={btn('primary')}>Continue: {next.title}</Link>
          ) : (
            <p className="text-sm text-brand">You have completed every available lesson.</p>
          )}
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-muted mb-1.5">
            <span>Next level</span>
            <span className="font-mono">{st.levelXp} / {st.levelSize} XP</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${(st.levelXp / st.levelSize) * 100}%` }} />
          </div>
        </div>

        <ol className="mt-5 flex items-center" aria-label="Rank progress">
          {st.ranks.map((r, idx) => (
            <li key={r} className="flex items-center flex-1 last:flex-none">
              <span title={r} className={`size-3 rounded-full shrink-0 ${idx <= st.modsDone ? 'bg-brand' : 'bg-surface-2 border border-line'}`} />
              {idx < st.ranks.length - 1 && <span className={`flex-1 h-0.5 mx-1 ${idx < st.modsDone ? 'bg-brand' : 'bg-line'}`} />}
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted mt-2">
          {nextRank ? `Complete a module to become ${nextRank}.` : 'You have reached the top rank.'}
        </p>
      </section>

      <div className="flex justify-end mb-2">
        <button onClick={toggleAll} className="text-sm text-brand hover:underline cursor-pointer">
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="space-y-3">
        {mods.map((m) => {
          const ls = learningService.getLessons(m.id)
          const d = ls.filter((l) => progress[l.id]).length
          const isOpen = !!open[m.id]
          const Icon = icons[m.id] ?? Compass
          return (
            <section key={m.id} className="rounded-2xl border border-line bg-surface" aria-label={m.title}>
              <button
                onClick={() => setOpen({ ...open, [m.id]: !isOpen })}
                aria-expanded={isOpen}
                aria-controls={`mod-${m.id}`}
                className="w-full flex items-center gap-4 p-5 text-left cursor-pointer rounded-2xl hover:bg-surface-2/50 transition-colors"
              >
                <span className="size-11 grid place-items-center rounded-xl bg-brand/10 text-brand shrink-0">
                  <Icon size={22} aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-semibold flex flex-wrap items-center gap-2">
                    {m.title}
                    {rec === m.id && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-brand/15 text-brand">
                        <Sparkles size={12} aria-hidden /> Recommended
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-muted">{m.mission}</span>
                  <span className="block mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <span className="block h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${ls.length ? (d / ls.length) * 100 : 0}%` }} />
                  </span>
                </span>
                <span className="text-xs font-mono text-muted">{ls.length ? `${d} / ${ls.length}` : 'Soon'}</span>
                <ChevronDown size={18} className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>

              {isOpen && (
                <div id={`mod-${m.id}`} className="px-5 pb-3">
                  {ls.length === 0 ? (
                    <p className="text-sm text-muted pb-2">Lessons coming soon.</p>
                  ) : (
                    <ul className="divide-y divide-line/60">
                      {ls.map((l) => {
                        const r = progress[l.id]
                        return (
                          <li key={l.id}>
                            <Link to={`/learn/${l.id}`} className="flex items-center gap-3 py-3 hover:text-brand transition-colors">
                              {r ? <CheckCircle2 size={18} className="text-brand shrink-0" aria-label="Completed" /> : <span className="size-[18px] rounded-full border-2 border-line shrink-0" aria-hidden />}
                              <span className="flex-1 text-sm">{l.title}</span>
                              {r && <span className="text-xs font-mono text-muted">{r.score}/{r.total}</span>}
                              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted"><Clock size={12} aria-hidden /> {l.min} min</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}