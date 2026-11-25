import { api, tokenStore } from './api'

const KEY = 'tradewise_user'
const save = (u) => {
  localStorage.setItem(KEY, JSON.stringify(u))
  return u
}

export const authService = {
  getUser() {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  },
  async login(email, password) {
    if (!email || !password) throw new Error('Email and password required')
    const { access_token, user } = await api.post('/auth/login', { email, password })
    tokenStore.set(access_token)
    return save(user)
  },
  async register(name, email, password) {
    if (!name || !email || !password) throw new Error('All fields required')
    const { access_token, user } = await api.post('/auth/register', { name, email, password })
    tokenStore.set(access_token)
    return save(user)
  },
  async refresh() {
    return save(await api.get('/users/me'))
  },
  // updates instantly in the UI, saves to the server in the background
  update(changes) {
    const user = save({ ...this.getUser(), ...changes })
    api.patch('/users/me', changes).catch((e) => console.error('Profile save failed', e))
    return user
  },
  logout() {
    localStorage.removeItem(KEY)
    tokenStore.clear()
  },
}