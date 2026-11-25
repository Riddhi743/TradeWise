import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui'

export default function Quiz({ questions, onComplete }) {
  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)

  const score = questions.filter((q, i) => answers[i] === q.answer).length
  const allAnswered = Object.keys(answers).length === questions.length

  const check = () => {
    setChecked(true)
    onComplete(score, questions.length)
  }
  const retry = () => {
    setAnswers({})
    setChecked(false)
  }

  return (
    <div>
      {questions.map((q, i) => (
        <fieldset key={i} className="mb-5" disabled={checked}>
          <legend className="text-sm font-medium mb-2">{i + 1}. {q.question}</legend>
          <div className="flex flex-col gap-2">
            {q.options.map((o, j) => {
              const picked = answers[i] === j
              const right = checked && j === q.answer
              const wrong = checked && picked && j !== q.answer
              const style = right ? 'border-brand bg-brand/10' : wrong ? 'border-danger bg-danger/10' : picked ? 'border-brand/60 bg-brand/5' : 'border-line hover:bg-surface-2'
              return (
                <label key={j} className={`flex items-center gap-3 min-h-11 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50 ${style}`}>
                  <input type="radio" name={`q${i}`} checked={picked} onChange={() => setAnswers({ ...answers, [i]: j })} className="sr-only" />
                  <span className="flex-1">{o}</span>
                  {right && <CheckCircle2 size={18} className="text-brand shrink-0" aria-label="Correct" />}
                  {wrong && <XCircle size={18} className="text-danger shrink-0" aria-label="Incorrect" />}
                </label>
              )
            })}
          </div>
          {checked && <p className="text-sm text-muted mt-2">{q.explanation}</p>}
        </fieldset>
      ))}

      {!checked ? (
        <Button disabled={!allAnswered} onClick={check}>Check answers</Button>
      ) : (
        <div className="flex items-center gap-4">
          <p className="font-semibold">You scored {score} / {questions.length}</p>
          <button onClick={retry} className="text-sm text-brand hover:underline cursor-pointer">Try again</button>
        </div>
      )}
    </div>
  )
}