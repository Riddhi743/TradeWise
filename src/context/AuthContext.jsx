import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'
import { learningService } from '../services/learningService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getUser())
  const [ready, setReady] = useState(!authService.getUser())

  // page refresh: verify the saved login and pull lesson progress from the server
  useEffect(() => {
    if (!authService.getUser()) return
    Promise.all([authService.refresh(), learningService.hydrate()])
      .then(([u]) => setUser(u))
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  // api.js fires this when the token is expired/invalid
  useEffect(() => {
    const out = () => {
      authService.logout()
      learningService.clear()
      setUser(null)
    }
    window.addEventListener('tradewise:logout', out)
    return () => window.removeEventListener('tradewise:logout', out)
  }, [])

  const login = async (email, password) => {
    const u = await authService.login(email, password)
    await learningService.hydrate()
    setUser(u)
  }
  const register = async (name, email, password) => {
    const u = await authService.register(name, email, password)
    learningService.clear()
    setUser(u)
  }
  const update = (changes) => setUser(authService.update(changes))
  const logout = () => {
    authService.logout()
    learningService.clear()
    setUser(null)
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, login, register, update, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)