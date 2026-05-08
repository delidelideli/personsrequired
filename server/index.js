import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { signToken, verifyToken, checkSubscription, TEST_USER } from './auth.js'
import { IndexSimulator, TickerSimulator } from './demo/priceSimulator.js'
import { startFlowStream } from './demo/orderFlow.js'

const PORT      = parseInt(process.env.PORT ?? '3001', 10)
const DEMO_MODE = process.env.DEMO_MODE === 'true'

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

// ── REST: auto-login (demo) or credential check ───────────────────────────
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  const validCred = email === TEST_USER.email && password === process.env.TEST_PASSWORD

  if (!DEMO_MODE && !validCred) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Demo mode: accept any request — hardcoded test user is always logged in
  const token = signToken({ id: TEST_USER.id, email: TEST_USER.email, plan: TEST_USER.plan })
  res.json({ token, user: { id: TEST_USER.id, email: TEST_USER.email, plan: TEST_USER.plan } })
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, demo: DEMO_MODE })
})

// ── HTTP server ───────────────────────────────────────────────────────────
const httpServer = createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

// JWT auth middleware — runs before 'connection' fires
io.use((socket, next) => {
  const token   = socket.handshake.auth?.token
  const payload = verifyToken(token)
  if (!payload) {
    return next(new Error('auth_error'))
  }
  socket.user = payload
  next()
})

io.on('connection', async (socket) => {
  // Stripe subscription gate — no data flows without an active sub
  const sub = await checkSubscription(socket.user.id)
  if (!sub.active) {
    socket.emit('sub_required', {
      message: 'No active subscription. Visit tradedesk.io to subscribe.',
    })
    socket.disconnect(true)
    return
  }

  console.log(`[+] ${socket.user.email}  plan=${socket.user.plan}`)

  // ── Index bar stream: SPY / QQQ / VIX / BTC / DXY every 2 s ─────────
  const idxSim      = new IndexSimulator()
  const idxInterval = setInterval(() => {
    socket.emit('index_tick', idxSim.tick())
  }, 2000)

  // ── Order flow stream ─────────────────────────────────────────────────
  const stopFlow = startFlowStream(socket)

  // ── Per-ticker candle stream ──────────────────────────────────────────
  let priceInterval = null

  function subscribeTicker(ticker, timeframe) {
    if (priceInterval) clearInterval(priceInterval)
    const sim = new TickerSimulator(ticker, timeframe)
    priceInterval = setInterval(() => {
      socket.emit('price_tick', sim.tick())
    }, 1000)
  }

  // Default on connect
  subscribeTicker('NVDA', '5m')

  socket.on('subscribe_ticker', ({ ticker, timeframe }) => {
    subscribeTicker(ticker ?? 'NVDA', timeframe ?? '5m')
  })

  socket.on('disconnect', () => {
    clearInterval(idxInterval)
    clearInterval(priceInterval)
    stopFlow()
    console.log(`[-] ${socket.user.email}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[server] TradeDesk proxy :${PORT}  demo=${DEMO_MODE}`)
})
