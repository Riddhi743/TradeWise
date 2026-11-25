const BASE = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'tradewise_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request(method, path, body) {
  const token = tokenStore.get()
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // expired/invalid token -> log out (but not for wrong-password on /auth/*)
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('tradewise:logout'))
    }
    const detail = data?.detail
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong. Check your input and try again.')
  }
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body),
}