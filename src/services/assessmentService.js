import { questions } from '../data/assessment'
import { modules } from '../data/modules'

const levelFor = (pct) => (pct < 40 ? 'Beginner' : pct < 70 ? 'Intermediate' : 'Advanced')

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const assessmentService = {
  // picks `count` different topics at random, then one random question from each
  getRandomQuestions: (count = 3) => {
    const topics = shuffle(modules.map((m) => m.id)).slice(0, count)
    return topics.map((t) => shuffle(questions.filter((q) => q.topic === t))[0])
  },
  // asked: the questions that were shown, answers: { [questionId]: chosenOptionIndex }
  score(asked, answers) {
    // pct stays null for topics that were not asked
    const byTopic = Object.fromEntries(modules.map((m) => [m.id, { correct: 0, total: 0, pct: null }]))

    const detail = asked.map((q) => {
      const chosen = answers[q.id] ?? null
      const correct = chosen === q.answer
      byTopic[q.topic].total += 1
      if (correct) byTopic[q.topic].correct += 1
      return { id: q.id, topic: q.topic, difficulty: q.difficulty, chosen, correct }
    })

    modules.forEach((m) => {
      const t = byTopic[m.id]
      t.pct = t.total ? Math.round((t.correct / t.total) * 100) : null
    })

    const correct = detail.filter((d) => d.correct).length
    const score = Math.round((correct / asked.length) * 100)

    // only topics that were actually tested count as weak
    const weakTopics = modules
      .filter((m) => byTopic[m.id].total > 0 && byTopic[m.id].pct < 50)
      .sort((a, b) => byTopic[a.id].pct - byTopic[b.id].pct)
      .map((m) => m.id)

    return {
      score, correct, total: asked.length,
      level: levelFor(score),
      byTopic, weakTopics,
      recommended: weakTopics[0] ?? modules[0].id,
      answers: detail,
      takenAt: new Date().toISOString(),
    }
  },
}