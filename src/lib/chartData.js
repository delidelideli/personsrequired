import { tfToSeconds, tfBarCount } from './timeframeUtils'

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

// ── OHLCV generation ───────────────────────────────────────────────────────
export function generateCandles(ticker = 'NVDA', timeframe = '5m') {
  const base  = BASE[ticker] ?? 100
  const bSec  = tfToSeconds(timeframe)
  const count = tfBarCount(bSec)
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

// ── SMA ────────────────────────────────────────────────────────────────────
export function calcSMA(candles, period) {
  const out = []
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const mean = slice.reduce((s, c) => s + c.close, 0) / period
    out.push({ time: candles[i].time, value: +mean.toFixed(2) })
  }
  return out
}

// ── Bollinger Bands (SMA ± N·σ) ───────────────────────────────────────────
export function calcBB(candles, period = 20, mult = 2) {
  const upper = [], middle = [], lower = []
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1)
    const mean = slice.reduce((s, c) => s + c.close, 0) / period
    const std  = Math.sqrt(slice.reduce((s, c) => s + (c.close - mean) ** 2, 0) / period)
    upper.push({ time: candles[i].time, value: +(mean + mult * std).toFixed(2) })
    middle.push({ time: candles[i].time, value: +mean.toFixed(2) })
    lower.push({ time: candles[i].time, value: +(mean - mult * std).toFixed(2) })
  }
  return { upper, middle, lower }
}

// ── Ichimoku (Tenkan 9 / Kijun 26 / Senkou A / Senkou B 52) ───────────────
export function calcIchimoku(candles) {
  function hl2(slice) {
    return (Math.max(...slice.map(c => c.high)) + Math.min(...slice.map(c => c.low))) / 2
  }
  const T = 9, K = 26, B = 52
  const tenkan = [], kijun = [], spanA = [], spanB = []
  for (let i = B - 1; i < candles.length; i++) {
    const t = hl2(candles.slice(i - T + 1, i + 1))
    const k = hl2(candles.slice(i - K + 1, i + 1))
    const b = hl2(candles.slice(i - B + 1, i + 1))
    tenkan.push({ time: candles[i].time, value: +t.toFixed(2) })
    kijun.push({  time: candles[i].time, value: +k.toFixed(2) })
    spanA.push({  time: candles[i].time, value: +((t + k) / 2).toFixed(2) })
    spanB.push({  time: candles[i].time, value: +b.toFixed(2) })
  }
  return { tenkan, kijun, spanA, spanB }
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
