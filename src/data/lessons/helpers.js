export const p = (text) => ({ t: 'p', text })
export const h = (text) => ({ t: 'h', text })
export const ul = (...items) => ({ t: 'ul', items })
export const f = (text) => ({ t: 'f', text })
export const eg = (text) => ({ t: 'eg', text })
export const tip = (text) => ({ t: 'tip', text })
export const q = (question, options, answer, explanation) => ({ question, options, answer, explanation })

// step builders
export const read = (...blocks) => ({ type: 'read', blocks })
export const choice = (o) => ({ type: 'choice', ...o })
export const calc = (o) => ({ type: 'calc', ...o })
export const quiz = (...questions) => ({ type: 'quiz', questions })
export const card = (title, ...rows) => ({ title, rows })