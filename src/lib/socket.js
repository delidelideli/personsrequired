import { io } from 'socket.io-client'
import { SERVER_URL } from './config'

const SERVER    = SERVER_URL
const TOKEN_KEY = 'td_token'

let _socket = null

// Auto-login with the demo test user, return JWT.
async function fetchToken() {
  try {
    const res = await fetch(`${SERVER}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: 'test@tradedesk.io', password: 'demo1234' }),
    })
    if (!res.ok) return null
    const { token } = await res.json()
    return token
  } catch {
    return null
  }
}

// Connect once per session. Returns the socket (or null if server is down).
export async function initSocket() {
  if (_socket?.connected) return _socket

  let token = sessionStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = await fetchToken()
    if (!token) return null          // server offline — UI runs on static data
    sessionStorage.setItem(TOKEN_KEY, token)
  }

  _socket = io(SERVER, {
    auth:                { token },
    transports:          ['websocket'],
    reconnectionDelay:   1000,
    reconnectionDelayMax: 8000,
  })

  // Token expired → re-fetch and reconnect once
  _socket.on('connect_error', async (err) => {
    if (err.message === 'auth_error') {
      sessionStorage.removeItem(TOKEN_KEY)
      const fresh = await fetchToken()
      if (fresh) {
        sessionStorage.setItem(TOKEN_KEY, fresh)
        _socket.auth.token = fresh
        _socket.connect()
      }
    }
  })

  return _socket
}

export function getSocket() { return _socket }
