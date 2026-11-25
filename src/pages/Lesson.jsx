import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Trophy } from 'lucide-react'
import { learningService } from '@/services/learningService'
import { modules } from '@/data/modules'
import { lessons } from '@/data/lessons'
import { btn } from '@/components/ui'
import Quiz from '@/components/Quiz'
import { Block, ChoiceStep, CalcStep } from '@/components/LessonSteps'

function Runner({ lesson }) {
  const [i, setI] = useState(0)
  const [results, setResults] = useState({}) // stepIndex -> { score, total, picked }
  const [summary, setSummary] = useState(null)

  useEffect(() => { window.scrollTo(0, 0) }, [i, summary])

  const steps = lesson.steps
  const step = steps[i]
  const last = i === steps.length - 1
  const answered = step.type === 'read' || !!results[i]
  const mod = modules.find((m) => m.id === lesson.topic)
  const next = lessons[lessons.findIndex((l) => l.id === lesson.id) + 1]
  const before = learningService.getProgress()[lesson.id]

  const record = (score, total, picked) => setResults((r) => ({ ...r, [i]: { score, total, picked } }))

  const finish = () => {
    const all = Object.values(results)
    const score = all.reduce((s, r) => s + r.score, 0)
    const total = all.reduce((s, r) => s + r.total, 0)
    const xp0 = learningService.stats().xp
    learningService.complete(lesson.id, score, total)
    setSummary({ score, total, gain: learningService.stats().xp - xp0 })
  }

  if (summary) {
    const st = learningService.stats()
    return (
      <article className="max-w-xl mx-auto text-center py-8">
        <span className="size-16 mx-auto grid place-items-center rounded-2xl bg-brand/10 text-brand mb-5">
          <Trophy size={32} aria-hidden />
        </span>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Lesson complete</h1>
        <p className="text-muted mb-6">{lesson.title}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-2xl font-bold font-mono">{summary.score}/{summary.total}</p>
            <p className="text-xs text-muted">correct answers</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-2xl font-bold font-mono text-brand">+{summary.gain} XP</p>
            <p className="text-xs text-muted">Level {st.level} · {st.xp} XP total</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mb-5">
          <button onClick={() => { setSummary(null); setI(0); setResults({}) }} className={btn('ghost')}>Replay lesson</button>
          {next
            ? <Link to={`/learn/${next.id}`} className={btn('primary')}>Next: {next.title} <ArrowRight size={18} aria-hidden /></Link>
            : <Link to="/learn" className={btn('primary')}>Back to your journey</Link>}
        </div>
        <Link to="/learn" className="text-sm text-muted hover:text-ink">Back to your journey</Link>
      </article>
    )
  }

  return (
    <article className="max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-sm text-muted mb-4">
        <Link to="/learn" className="hover:text-ink">Learn</Link> / {mod?.title}
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold mb-3">{lesson.title}</h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-4">
        <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden /> {lesson.min} min</span>
        <span>Step {i + 1} of {steps.length}</span>
        {before && <span className="text-brand">Completed before · best {before.score}/{before.total}</span>}
      </div>
      <div className="flex gap-1.5 mb-6" role="progressbar" aria-label="Lesson progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1}>
        {steps.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full transition-colors ${k <= i ? 'bg-brand' : 'bg-surface-2'}`} />)}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 md:p-7 mb-6">
        {step.type === 'read' && (
          <>
            {step.blocks.map((b, k) => <Block key={k} b={b} />)}
            <p className="text-xs text-muted mt-2">Educational content only. This is not investment advice.</p>
          </>
        )}
        {step.type === 'choice' && (
          <ChoiceStep key={i} step={step} picked={results[i]?.picked} onPick={(j) => record(j === step.answer ? 1 : 0, 1, j)} />
        )}
        {step.type === 'calc' && (
          <CalcStep key={i} step={step} submitted={results[i]?.picked} onSubmit={(text, ok) => record(ok ? 1 : 0, 1, { text, ok })} />
        )}
        {step.type === 'quiz' && (
          <>
            <h2 className="font-semibold mb-1">Check your understanding</h2>
            <p className="text-sm text-muted mb-5">Answer all questions, then finish the lesson. You can retry before finishing.</p>
            <Quiz key={i} questions={step.questions} onComplete={(s, t) => record(s, t)} />
          </>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button onClick={() => setI(i - 1)} disabled={i === 0} className={btn('ghost')}><ArrowLeft size={16} aria-hidden /> Back</button>
        {last
          ? <button onClick={finish} disabled={!answered} className={btn('primary')}>Finish lesson</button>
          : <button onClick={() => setI(i + 1)} disabled={!answered} className={btn('primary')}>Continue <ArrowRight size={16} aria-hidden /></button>}
      </div>
    </article>
  )
}

export default function Lesson() {
  const { lessonId } = useParams()
  const lesson = learningService.getLesson(lessonId)
  if (!lesson) return <Navigate to="/learn" replace />
  return <Runner key={lesson.id} lesson={lesson} />
}