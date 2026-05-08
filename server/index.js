import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { signToken, verifyToken, checkSubscription, TEST_USER } from './auth.js'
import dataProvider from './dataProvider.js'

const PORT      = parseInt(process.env.PORT ?? '3001', 10)
const DEMO_MODE = process.env.DEMO_MODE === 'true'

const app = express()
app.use(cors({ origin: '*' }))   // TODO production: lock to chrome-extension://<ID>
app.use(express.json())

// ── REST: auth ────────────────────────────────────────────────────────────────
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  const validCred = email === TEST_USER.email && password === process.env.TEST_PASSWORD

  if (!DEMO_MODE && !validCred) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken({ id: TEST_USER.id, email: TEST_USER.email, plan: TEST_USER.plan })
  res.json({ token, user: { id: TEST_USER.id, email: TEST_USER.email, plan: TEST_USER.plan } })
})

// ── REST: historical OHLCV ────────────────────────────────────────────────────
// SWAP dataProvider.getHistory for a real API call in production.
// The client always hits this endpoint — no candle generation in the browser.
app.get('/history', async (req, res) => {
  const { ticker = 'NVDA', timeframe = '5m' } = req.query
  try {
    const candles = await dataProvider.getHistory(ticker, timeframe)
    res.json(candles)
  } catch (err) {
    console.error('[history]', err.message)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, demo: DEMO_MODE })
})

// ── HTTP server ───────────────────────────────────────────────────────────────
const httpServer = createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

io.use((socket, next) => {
  const payload = verifyToken(socket.handshake.auth?.token)
  if (!payload) return next(new Error('auth_error'))
  socket.user = payload
  next()
})

io.on('connection', async (socket) => {
  const sub = await checkSubscription(socket.user.id)
  if (!sub.active) {
    socket.emit('sub_required', { message: 'No active subscription.' })
    socket.disconnect(true)
    return
  }

  console.log(`[+] ${socket.user.email}  plan=${socket.user.plan}`)

  // ── Start streams via data provider ──────────────────────────────────────
  const stopIndex = dataProvider.startIndexStream(data => socket.emit('index_tick', data))
  const stopFlow  = dataProvider.startFlowStream(ev   => socket.emit('flow_event', ev))
  let   stopTicker = null

  function subscribeTicker(ticker, timeframe) {
    if (stopTicker) stopTicker()
    stopTicker = dataProvider.startTickerStream(
      ticker ?? 'NVDA',
      timeframe ?? '5m',
      data => socket.emit('price_tick', data),
    )
  }

  subscribeTicker('NVDA', '5m')

  socket.on('subscribe_ticker', ({ ticker, timeframe }) => {
    subscribeTicker(ticker, timeframe)
  })

  socket.on('disconnect', () => {
    stopIndex()
    stopFlow()
    if (stopTicker) stopTicker()
    console.log(`[-] ${socket.user.email}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[server] TradeDesk proxy :${PORT}  demo=${DEMO_MODE}`)
})
