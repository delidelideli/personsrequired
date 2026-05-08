// Client-side simulation hub — mirrors the server's data streams.
// Used automatically when the backend server is offline.

// ── Base prices ─────────────────────────────────────────────────────────────
const BASE = {
  NVDA: 924.50, TSLA: 248.12, META: 512.33, AAPL: 189.67,
  SPY:  524.83, QQQ:  448.12, AMD:  172.44,
  VIX:  18.42,  BTC:  67420,  DXY:  104.21,
}

const VOLATILITY = {
  VIX: 0.0025, BTC: 0.0012, TSLA: 0.0010, AMD: 0.0009,
  NVDA: 0.0008, META: 0.0006, AAPL: 0.0005,
  SPY: 0.0004, QQQ: 0.0004, DXY: 0.0003,
}

const CANDLE_MS = {
  '1m': 60_000, '5m': 300_000, '15m': 900_000,
  '1h': 3_600_000, '4h': 14_400_000, 'D': 86_400_000,
}

function walk(price, sym) {
  const vol = VOLATILITY[sym] ?? 0.0007
  return Math.max(0.01, price + price * (Math.random() - 0.499) * vol)
}

// ── Flow generator ───────────────────────────────────────────────────────────
const TICKERS  = ['NVDA', 'TSLA', 'META', 'AAPL', 'SPY', 'AMD']
const TYPES    = ['SWEEP', 'SWEEP', 'SWEEP', 'BLOCK', 'SPLIT']
const EXPIRIES = ['5/17', '5/24', '5/31', '6/21']
const STRIKES  = {
  NVDA: [910,920,930,940,950], TSLA: [240,245,250,255,260],
  META: [500,505,510,515,520], AAPL: [185,187,190,192,195],
  SPY:  [518,520,522,524,526], AMD:  [160,165,168,170,175],
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function fmtSize(val) {
  return val >= 1_000_000
    ? '$' + (val / 1_000_000).toFixed(1) + 'M'
    : '$' + Math.round(val / 1_000) + 'K'
}

function genFlow() {
  const ticker  = pick(TICKERS)
  const type    = pick(TYPES)
  const isSplit = type === 'SPLIT'
  const bull    = isSplit ? null : Math.random() > 0.45
  const strike  = pick(STRIKES[ticker] ?? [100])
  const side    = isSplit ? (Math.random() > 0.5 ? 'C' : 'P') : (bull ? 'C' : 'P')
  const sizeVal = Math.floor(Math.random() * 1_150_000) + 50_000
  return {
    id: `${Date.now()}-${Math.random()}`,
    ticker, type, bull, sizeVal,
    contract: `${strike}${side} ${pick(EXPIRIES)}`,
    price:    '$' + (Math.random() * 9 + 0.5).toFixed(2),
    size:     fmtSize(sizeVal),
    ts:       Date.now(),
  }
}

// ── Pub / sub ────────────────────────────────────────────────────────────────
const _listeners = {}

function on(event, fn) {
  if (!_listeners[event]) _listeners[event] = []
  _listeners[event].push(fn)
  return () => off(event, fn)
}

function off(event, fn) {
  _listeners[event] = (_listeners[event] ?? []).filter(f => f !== fn)
}

function emit(event, data) {
  _listeners[event]?.forEach(fn => fn(data))
}

// ── Internal state ───────────────────────────────────────────────────────────
const prices     = { ...BASE }
const opens      = { ...BASE }           // session opens for % change
let   activeSym  = 'NVDA'
let   tfMs       = 300_000               // 5m default
let   candleStart = Math.floor(Date.now() / tfMs) * tfMs
let   cOpen = BASE.NVDA, cHigh = BASE.NVDA, cLow = BASE.NVDA
const intervals  = []

// ── Streams ──────────────────────────────────────────────────────────────────

function tickIndex() {
  const result = {}
  for (const sym of ['SPY', 'QQQ', 'VIX', 'BTC', 'DXY']) {
    prices[sym] = walk(prices[sym], sym)
    const pct = (prices[sym] - opens[sym]) / opens[sym] * 100
    result[sym] = {
      price:  prices[sym].toFixed(sym === 'BTC' ? 0 : 2),
      change: (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%',
      up:     pct >= 0,
    }
  }
  emit('index_tick', result)
}

function tickPrice() {
  prices[activeSym] = walk(prices[activeSym], activeSym)
  const p   = prices[activeSym]
  const now = Date.now()
  const ns  = Math.floor(now / tfMs) * tfMs

  if (ns > candleStart) {
    candleStart = ns
    cOpen = p; cHigh = p; cLow = p
  } else {
    cHigh = Math.max(cHigh, p)
    cLow  = Math.min(cLow,  p)
  }

  const pct = (p - opens[activeSym]) / opens[activeSym] * 100
  emit('price_tick', {
    ticker:  activeSym,
    candle:  {
      time:   Math.floor(candleStart / 1000),
      open:   parseFloat(cOpen.toFixed(2)),
      high:   parseFloat(cHigh.toFixed(2)),
      low:    parseFloat(cLow.toFixed(2)),
      close:  parseFloat(p.toFixed(2)),
      volume: Math.floor(Math.random() * 180_000) + 40_000,
    },
    price:   parseFloat(p.toFixed(2)),
    change:  (pct >= 0 ? '+' : '') + pct.toFixed(2),
    changeP: (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%',
    up:      pct >= 0,
  })
}

function tickFlow() {
  emit('flow_event', genFlow())
}

// ── Public API ───────────────────────────────────────────────────────────────

function start(ticker = 'NVDA', timeframe = '5m') {
  activeSym   = ticker
  tfMs        = CANDLE_MS[timeframe] ?? 300_000
  candleStart = Math.floor(Date.now() / tfMs) * tfMs
  cOpen = cHigh = cLow = prices[ticker] ?? 100

  intervals.push(
    setInterval(tickIndex, 3000),   // index bar every 3 s
    setInterval(tickPrice, 1000),   // active ticker every 1 s
    setInterval(tickFlow,  2000),   // flow event every 2 s
  )

  // Fire immediately so UI isn't blank on mount
  tickIndex()
  tickPrice()
}

function setTicker(ticker, timeframe) {
  activeSym   = ticker
  tfMs        = CANDLE_MS[timeframe] ?? tfMs
  candleStart = Math.floor(Date.now() / tfMs) * tfMs
  cOpen = cHigh = cLow = prices[ticker] ?? prices[activeSym] ?? 100
}

function stop() {
  intervals.forEach(clearInterval)
  intervals.length = 0
}

export const mockDataService = { on, off, start, stop, setTicker }
