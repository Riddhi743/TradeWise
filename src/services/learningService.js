import { modules } from '../data/modules'
import { lessons } from '../data/lessons'
import { api } from './api'

const KEY = 'tradewise_learning'
const RANKS = ['Market Beginner', 'Stock Explorer', 'Market Detective', 'Technical Analyst', 'Market Master']
const LEVEL_SIZE = 150

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {} } catch { return {} }
}

// Phase 7: replace with FastAPI calls
export const learningService = {
  getModules: () => modules,
  getLessons: (topic) => lessons.filter((l) => l.topic === topic),
  getLesson: (id) => lessons.find((l) => l.id === id),
  findLesson: (title) => lessons.find((l) => l.title.toLowerCase() === (title ?? '').toLowerCase()),

  // { [lessonId]: { score, total, at } }
  getProgress: () => read(),
    async hydrate() {
    try {
      localStorage.setItem(KEY, JSON.stringify(await api.get('/learning/progress')))
    } catch (e) {
      console.error('Could not load progress', e)
    }
  },
  clear() {
    localStorage.removeItem(KEY)
  },

  complete(id, score, total) {
    const p = read()
    p[id] = { score: Math.max(score, p[id]?.score ?? 0), total, at: new Date().toISOString() }
    localStorage.setItem(KEY, JSON.stringify(p))
    api.post('/learning/progress', { lessonId: id, score, total }).catch(console.error)
    return p
  },

  completedCount() {
    const p = read()
    return { done: lessons.filter((l) => p[l.id]).length, total: lessons.length }
  },

  // XP per completed lesson = 20 + 10 per correct answer (best attempt)
  stats() {
    const p = read()
    const xp = lessons.filter((l) => p[l.id]).reduce((s, l) => s + 20 + 10 * p[l.id].score, 0)
    const modsDone = modules.filter((m) => {
      const ls = lessons.filter((l) => l.topic === m.id)
      return ls.length > 0 && ls.every((l) => p[l.id])
    }).length
    return {
      xp, level: Math.floor(xp / LEVEL_SIZE) + 1, levelXp: xp % LEVEL_SIZE, levelSize: LEVEL_SIZE,
      modsDone, rank: RANKS[Math.min(modsDone, RANKS.length - 1)], ranks: RANKS,
    }
  },

  // rule-based: recommended topic first, then other weak topics, then curriculum order
  nextLesson(assessment) {
    const p = read()
    const order = [assessment?.recommended, ...(assessment?.weakTopics ?? []), ...modules.map((m) => m.id)].filter(Boolean)
    for (const topic of order) {
      const l = lessons.find((x) => x.topic === topic && !p[x.id])
      if (l) return l
    }
    return null
  },
}