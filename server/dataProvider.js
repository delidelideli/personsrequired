// Data provider abstraction.
// The demo implementation below uses brownian-motion simulators.
// To wire real data: replace each method body with API calls —
// the server router and socket handlers stay identical.

import { IndexSimulator, TickerSimulator } from './demo/priceSimulator.js'
import { startFlowStream }                  from './demo/orderFlow.js'
import { tfToSeconds, tfBarCount }          from './utils.js'

// ── Seeded candle generator (mirrors src/lib/chartData.js) ──────────────────
// Replaced by a real REST fetch (Polygon.io, Alpaca, etc.) in production.

const BASE = {
  NVDA: 924.50, TSLA: 248.12, META: 512.33,
  AAPL: 189.67, SPY:  524.83, AMD:  172.44,
}

function createRng(seed) {
  let s = seed >>> 0
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296 }
}

function ticker2seed(ticker, timeframe) {
  const t = ticker + timeframe
  let h = 0
  for (let i = 0; i < t.length; i++) h = (Math.imul(31, h) + t.charCodeAt(i)) >>> 0
  return h
}

function generateCandles(ticker, timeframe) {
  const base  = BASE[ticker] ?? 100
  const bSec  = tfToSeconds(timeframe)
  const count = tfBarCount(bSec)
  const rand  = createRng(ticker2seed(ticker, timeframe))
  const vol   = base * 0.0012 * Math.pow(bSec / 60, 0.38)
  const now   = Math.floor(Date.now() / 1000)
  const latest = now - (now % bSec)

  let price = base * (0.96 + rand() * 0.08)
  const candles = []

  for (let i = count - 1; i >= 0; i--) {
    const time  = latest - i * bSec
    const open  = price
    const drift = (base - price) * 0.008
    const close = Math.max(open * 0.97, open + (rand() - 0.49) * vol * 2 + drift)
    const span  = Math.abs(close - open)
    const high  = Math.max(open, close) + rand() * span * 0.7
    const low   = Math.min(open, close) - rand() * span * 0.7
    candles.push({
      time,
      open:   +open.toFixed(2),
      high:   +high.toFixed(2),
      low:    +low.toFixed(2),
      close:  +close.toFixed(2),
      volume: Math.floor((150000 + rand() * 650000) * (1 + (span / base) * 8)),
    })
    price = close
  }
  return candles
}

// ── Demo data provider ───────────────────────────────────────────────────────
// Each method returns a stop function (or a Promise resolving to data).
// Swap these implementations when real API adapters are ready.

const demoProvider = {
  // SWAP: fetch from Polygon.io /v2/aggs/ticker/.../range/... and cache result
  async getHistory(ticker, timeframe) {
    return generateCandles(ticker, timeframe)
  },

  // SWAP: connect to upstream Polygon WebSocket, subscribe to 'A.*' (aggregates)
  startIndexStream(emitFn) {
    const sim = new IndexSimulator()
    const id  = setInterval(() => emitFn(sim.tick()), 2000)
    return () => clearInterval(id)
  },

  // SWAP: subscribe to upstream WS for this specific symbol/timeframe
  startTickerStream(ticker, timeframe, emitFn) {
    const sim = new TickerSimulator(ticker, timeframe)
    const id  = setInterval(() => emitFn(sim.tick()), 1000)
    return () => clearInterval(id)
  },

  // SWAP: connect to options flow provider (Unusual Whales, etc.)
  startFlowStream(emitFn) {
    return startFlowStream({ emit: (_, data) => emitFn(data) })
  },
}

export default demoProvider
