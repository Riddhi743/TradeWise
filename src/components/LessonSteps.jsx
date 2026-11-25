import { useState } from 'react'
import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'

export function Block({ b }) {
  switch (b.t) {
    case 'h':
      return <h2 className="text-lg font-semibold mt-6 mb-2">{b.text}</h2>
    case 'ul':
      return <ul className="list-disc pl-5 space-y-1.5 mb-4 text-ink/85 marker:text-brand">{b.items.map((i) => <li key={i}>{i}</li>)}</ul>
    case 'f':
      return <p className="font-mono text-sm rounded-xl bg-surface-2 border border-line px-4 py-3 mb-4 overflow-x-auto">{b.text}</p>
    case 'eg':
      return (
        <div className="rounded-xl border border-line bg-surface-2 p-4 mb-4 text-sm">
          <p className="text-xs text-muted font-mono mb-1">Example</p>
          {b.text}
        </div>
      )
    case 'tip':
      return (
        <div className="flex gap-3 rounded-xl border border-brand/30 bg-brand/10 p-4 mb-4 text-sm">
          <Lightbulb size={18} className="text-brand shrink-0 mt-0.5" aria-hidden />
          <p>{b.text}</p>
        </div>
      )
    default:
      return <p className="mb-4 text-ink/85 leading-relaxed">{b.text}</p>
  }
}

function Tag({ children }) {
  return <span className="inline-block mb-4 text-xs font-medium px-2.5 py-1 rounded-full bg-brand/10 text-brand">{children}</span>
}

function Cards({ cards }) {
  return (
    <div className={`grid gap-3 mb-5 ${cards.length > 1 ? 'sm:grid-cols-2' : ''}`}>
      {cards.map((c) => (
        <div key={c.title} className="rounded-xl border border-line bg-surface-2 p-4">
          <p className="font-semibold mb-2">{c.title}</p>
          <dl className="space-y-1 text-sm font-mono">
            {c.rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted font-sans">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

function Feedback({ ok, children }) {
  return (
    <div role="status" className={`rounded-xl border p-4 text-sm ${ok ? 'border-brand/30 bg-brand/10' : 'border-warn/30 bg-warn/10'}`}>
      <p className="font-semibold mb-1">{ok ? 'Correct' : 'Not quite'}</p>
      <p className="text-ink/85">{children}</p>
    </div>
  )
}

export function ChoiceStep({ step, picked, onPick }) {
  const answered = picked !== undefined
  return (
    <div>
      <Tag>{step.tag}</Tag>
      {step.cards && <Cards cards={step.cards} />}
      <h2 className="text-lg font-semibold mb-4">{step.question}</h2>
      <div className="flex flex-col gap-2 mb-4">
        {step.options.map((o, j) => {
          const right = answered && j === step.answer
          const wrong = answered && picked === j && j !== step.answer
          const style = right ? 'border-brand bg-brand/10' : wrong ? 'border-danger bg-danger/10' : 'border-line hover:bg-surface-2'
          return (
            <button
              key={j}
              aria-pressed={picked === j}
              disabled={answered}
              onClick={() => onPick(j)}
              className={`flex items-center gap-3 min-h-11 px-4 py-3 rounded-xl border text-left text-sm transition-colors ${answered ? 'cursor-default' : 'cursor-pointer'} ${style}`}
            >
              <span className="flex-1">{o}</span>
              {right && <CheckCircle2 size={18} className="text-brand shrink-0" aria-label="Correct answer" />}
              {wrong && <XCircle size={18} className="text-danger shrink-0" aria-label="Your answer" />}
            </button>
          )
        })}
      </div>
      {answered && <Feedback ok={picked === step.answer}>{step.explain}</Feedback>}
    </div>
  )
}

export function CalcStep({ step, submitted, onSubmit }) {
  const [text, setText] = useState(submitted?.text ?? '')

  const check = () => {
    const n = parseFloat(text.replace(/[,\s₹]/g, '').replace('−', '-'))
    if (Number.isNaN(n)) return
    onSubmit(text, Math.abs(n - step.answer) <= (step.tol ?? 0))
  }

  return (
    <div>
      <Tag>{step.tag}</Tag>
      {step.cards && <Cards cards={step.cards} />}
      <h2 className="text-lg font-semibold mb-4">{step.question}</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (!submitted) check() }} className="flex flex-wrap items-center gap-3 mb-4">
        <label htmlFor="calc" className="sr-only">Your answer</label>
        <div className="relative">
          <input
            id="calc" inputMode="decimal" placeholder="Your answer" value={text} disabled={!!submitted}
            onChange={(e) => setText(e.target.value)}
            className="w-48 min-h-11 px-3.5 pr-14 rounded-xl bg-surface-2 border border-line focus:border-brand/60 font-mono"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{step.unit}</span>
        </div>
        {!submitted && <Button disabled={!text.trim()}>Check</Button>}
      </form>
      {submitted && (
        <Feedback ok={submitted.ok}>
          {!submitted.ok && <>The answer is {step.answer.toLocaleString('en-IN')} {step.unit}. </>}
          {step.explain}
        </Feedback>
      )}
    </div>
  )
}