// ── Seeded PRNG (LCG) ─────────────────────────────────────────────────────
// Produces consistent data for the same ticker+timeframe across renders.
function createRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 4294967296
  }
}

function ticker2seed(ticker, timeframe) {
  const t = ticker + timeframe
  let h = 0
  for (let i = 0; i < t.length; i++) h = (Math.imul(31, h) + t.charCodeAt(i)) >>> 0
  return h
}

// ── Base prices and bar config ─────────────────────────────────────────────
const BASE = {
  NVDA: 924.50, TSLA: 248.12, META: 512.33,
  AAPL: 189.67, SPY:  524.83, AMD:  172.44,
}

const BAR_SEC = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, 'D': 86400, 'W': 604800 }
const BAR_COUNT = { '1m': 240, '5m': 240, '15m': 200, '1h': 200, '4h': 180, 'D': 200, 'W': 100 }

// ── OHLCV generation ───────────────────────────────────────────────────────
export function generateCandles(ticker = 'NVDA', timeframe = '5m') {
  const base  = BASE[ticker] ?? 100
  const bSec  = BAR_SEC[timeframe]  ?? 300
  const count = BAR_COUNT[timeframe] ?? 200
  const rand  = createRng(ticker2seed(ticker, timeframe))

  // Volatility scales with bar duration and price magnitude
  const vol = base * 0.0012 * Math.pow(bSec / 60, 0.38)

  const now          = Math.floor(Date.now() / 1000)
  const latestTime   = now - (now % bSec)

  let price = base * (0.96 + rand() * 0.08)
  const candles = []

  for (let i = count - 1; i >= 0; i--) {
    const time  = latestTime - i * bSec
    const open  = price

    // Slight mean-reversion drift keeps price near the base
    const drift = (base - price) * 0.008
    const close = Math.max(open * 0.97, open + (rand() - 0.49) * vol * 2 + drift)

    const span   = Math.abs(close - open)
    const high   = Math.max(open, close) + rand() * span * 0.7
    const low    = Math.min(open, close) - rand() * span * 0.7
    const volume = Math.floor((150000 + rand() * 650000) * (1 + (span / base) * 8))

    candles.push({
      time,
      open:   +open.toFixed(2),
      high:   +high.toFixed(2),
      low:    +low.toFixed(2),
      close:  +close.toFixed(2),
      volume,
    })

    price = close
  }

  return candles
}

// ── EMA ────────────────────────────────────────────────────────────────────
export function calcEMA(candles, period) {
  const k = 2 / (period + 1)
  const out = []
  let ema = candles[0].close

  candles.forEach((c, i) => {
    ema = i === 0 ? c.close : c.close * k + ema * (1 - k)
    if (i >= period - 1) out.push({ time: c.time, value: +ema.toFixed(2) })
  })

  return out
}

// ── VWAP (resets each "session" — full dataset treated as one session) ──────
export function calcVWAP(candles) {
  let cumTPV = 0
  let cumVol = 0

  return candles.map(c => {
    const tp = (c.high + c.low + c.close) / 3
    cumTPV += tp * c.volume
    cumVol += c.volume
    return { time: c.time, value: +(cumTPV / cumVol).toFixed(2) }
  })
}

// ── PDH / PDL / PMH / PML ─────────────────────────────────────────────────
// Treat the first quarter of candles as "previous session" data.
export function calcLevels(candles) {
  const prev = candles.slice(0, Math.max(1, Math.floor(candles.length / 4)))
  const pdh  = +Math.max(...prev.map(c => c.high)).toFixed(2)
  const pdl  = +Math.min(...prev.map(c => c.low)).toFixed(2)
  // Pre-market high/low sit just outside the previous session range
  const pmh  = +(pdh * 1.007).toFixed(2)
  const pml  = +(pdl * 0.993).toFixed(2)
  return { pdh, pdl, pmh, pml }
}
