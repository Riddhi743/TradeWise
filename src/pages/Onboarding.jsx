import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Logo, Button, btn } from '@/components/ui'
import { assessmentService } from '@/services/assessmentService'
import { modules } from '@/data/modules'

const profileSteps = [
  { key: 'level', title: 'How would you describe your experience?', options: ['Complete beginner', 'I know some basics', 'I have traded before'] },
  { key: 'goal', title: 'What do you want out of TradeWise?', options: ['Understand how the market works', 'Learn technical analysis', 'Manage risk better'] },
]

const topicTitle = (id) => modules.find((m) => m.id === id)?.title ?? id
const barColor = (pct) => (pct >= 70 ? 'bg-brand' : pct >= 40 ? 'bg-warn' : 'bg-danger')

function Option({ name, checked, onChange, children }) {
  return (
    <label className="flex items-center gap-3 min-h-12 px-4 py-3 rounded-xl border border-line bg-surface cursor-pointer transition-colors duration-200 hover:border-brand/40 has-[:checked]:border-brand has-[:checked]:bg-brand/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`size-4 rounded-full border-2 grid place-items-center shrink-0 ${checked ? 'border-brand' : 'border-muted'}`}>
        {checked && <span className="size-2 rounded-full bg-brand" />}
      </span>
      <span className="text-sm">{children}</span>
    </label>
  )
}

function Ring({ pct }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-brand)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-3xl font-extrabold font-mono">{pct}%</span>
      </div>
    </div>
  )
}

export default function Onboarding() {
    const { user, update } = useAuth()
  const navigate = useNavigate()
  const retake = !!user?.onboarded
  const [questions] = useState(() => assessmentService.getRandomQuestions(3))
  const N = questions.length
  const total = 2 + N

    const [i, setI] = useState(retake ? 2 : 0)
  const [choice, setChoice] = useState({ level: '', goal: '' })
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const inProfile = i < 2
  const done = i >= total
  const q = !inProfile && !done ? questions[i - 2] : null
  const step = profileSteps[i]

  const next = () => {
        if (q && i === total - 1) setResult(assessmentService.score(questions, answers))
    setI(i + 1)
  }

  const finish = (assessment) => {
        update(retake ? { assessment } : { onboarded: true, ...choice, assessment })
    navigate('/dashboard')
  }

  const label = inProfile ? `About you · ${i + 1} of 2` : done ? 'Your results' : `Question ${i - 1} of ${N}`
    const base = retake ? 2 : 0
  const pct = done ? 100 : ((i - base) / (total - base)) * 100

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <Logo className="my-6" />
      <div className="w-full max-w-2xl">
        <div className="mb-2 flex justify-between text-sm text-muted">
          <span>{label}</span>
            {i > base && !done && (
            <button onClick={() => setI(i - 1)} className="inline-flex items-center gap-1 hover:text-ink cursor-pointer">
              <ArrowLeft size={14} aria-hidden /> Back
            </button>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 mb-8" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        <div className="rounded-2xl border border-line bg-surface-2/40 p-6 md:p-8">
          {inProfile && (
            <fieldset>
              <legend className="text-xl font-bold mb-5">{step.title}</legend>
              <div className="flex flex-col gap-2 mb-6">
                {step.options.map((o) => (
                  <Option key={o} name={step.key} checked={choice[step.key] === o} onChange={() => setChoice({ ...choice, [step.key]: o })}>{o}</Option>
                ))}
              </div>
              <Button disabled={!choice[step.key]} onClick={next}>Continue <ArrowRight size={18} aria-hidden /></Button>
            </fieldset>
          )}

          {q && (
            <fieldset>
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-brand/10 text-brand font-medium">{topicTitle(q.topic)}</span>
                <span className="px-2.5 py-1 rounded-full border border-line text-muted capitalize">{q.difficulty}</span>
              </div>
              <legend className="text-xl font-bold mb-5 leading-snug">{q.question}</legend>
              <div className="flex flex-col gap-2 mb-6">
                {q.options.map((o, idx) => (
                  <Option key={idx} name={q.id} checked={answers[q.id] === idx} onChange={() => setAnswers({ ...answers, [q.id]: idx })}>{o}</Option>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button disabled={answers[q.id] === undefined} onClick={next}>
                  {i === total - 1 ? 'See results' : 'Next'} <ArrowRight size={18} aria-hidden />
                </Button>
                                <button onClick={() => (retake ? navigate('/dashboard') : finish(null))} className="text-sm text-muted hover:text-ink cursor-pointer">
                  {retake ? 'Cancel' : 'Skip quiz'}
                </button>
              </div>
            </fieldset>
          )}

          {done && result && (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <Ring pct={result.score} />
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted">Your starting level</p>
                  <h1 className="text-3xl font-extrabold">{result.level}</h1>
                  <p className="text-muted mt-1">{result.correct} of {result.total} correct</p>
                </div>
              </div>

              <h2 className="font-semibold mb-3">By topic</h2>
              <ul className="space-y-3 mb-8">
                                {modules.filter((m) => result.byTopic[m.id].total > 0).map((m) => {
                  const t = result.byTopic[m.id]
                  return (
                    <li key={m.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{m.title}</span>
                        <span className="font-mono text-muted">{t.correct}/{t.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(t.pct)}`} style={{ width: `${t.pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="rounded-xl border border-brand/30 bg-brand/10 p-4 mb-6 flex gap-3">
                <Sparkles size={20} className="text-brand shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm">
                  <span className="font-semibold text-brand">Start with: </span>
                  {topicTitle(result.recommended)}. {result.weakTopics.length > 0 ? 'This is where you scored lowest.' : 'You did well across the board, so begin with the fundamentals and move quickly.'}
                </p>
              </div>

              {result.answers.some((a) => !a.correct) && (
                <div className="mb-8">
                  <h2 className="font-semibold mb-3">Review what you missed</h2>
                  <div className="space-y-2">
                    {result.answers.filter((a) => !a.correct).map((a) => {
                      const qq = questions.find((x) => x.id === a.id)
                      return (
                        <details key={a.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                          <summary className="cursor-pointer text-sm font-medium">{qq.question}</summary>
                          <p className="text-sm mt-3"><span className="text-muted">Correct answer: </span>{qq.options[qq.answer]}</p>
                          <p className="text-sm text-muted mt-1">{qq.explanation}</p>
                        </details>
                      )
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => finish(result)} className={`${btn('primary', 'lg')} w-full`}>
                Go to my dashboard <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}