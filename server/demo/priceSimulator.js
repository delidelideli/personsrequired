// Brownian-motion price simulator — no real API keys required.
import { tfToSeconds } from '../utils.js'

const BASE_PRICES = {
  NVDA: 924.50, TSLA: 248.12, META: 512.33, AAPL: 189.67,
  SPY:  524.83, QQQ:  448.12, AMD:  172.44,
  VIX:  18.42,  BTC:  67420,  DXY:  104.21,
}


// Per-symbol volatility (fraction per tick)
const VOLATILITY = {
  VIX: 0.0025, BTC: 0.0012, TSLA: 0.0010, AMD: 0.0009,
  NVDA: 0.0008, META: 0.0006, AAPL: 0.0005, SPY: 0.0004, QQQ: 0.0004, DXY: 0.0003,
}

function walk(price, sym) {
  const vol = VOLATILITY[sym] ?? 0.0007
  // Slight upward bias (0.001 drift) so prices don't collapse
  const delta = price * ((Math.random() - 0.499) * vol)
  return Math.max(0.01, price + delta)
}

// ── Index bar simulator (SPY / QQQ / VIX / BTC / DXY) ─────────────────────
export class IndexSimulator {
  constructor() {
    this.prices = { ...BASE_PRICES }
    this.opens  = { ...BASE_PRICES }
  }

  tick() {
    const result = {}
    for (const sym of ['SPY', 'QQQ', 'VIX', 'BTC', 'DXY']) {
      this.prices[sym] = walk(this.prices[sym], sym)
      const chg = (this.prices[sym] - this.opens[sym]) / this.opens[sym] * 100
      const decimals = sym === 'BTC' ? 0 : 2
      result[sym] = {
        price:  this.prices[sym].toFixed(decimals),
        change: (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%',
        up:     chg >= 0,
      }
    }
    return result
  }
}

// ── Per-ticker candle simulator ────────────────────────────────────────────
export class TickerSimulator {
  constructor(ticker, timeframe) {
    this.ticker       = ticker
    this.tfMs         = tfToSeconds(timeframe) * 1000
    this.price        = BASE_PRICES[ticker] ?? 100
    this.sessionOpen  = this.price
    this.candleStart  = Math.floor(Date.now() / this.tfMs) * this.tfMs
    this.candleOpen   = this.price
    this.candleHigh   = this.price
    this.candleLow    = this.price
  }

  tick() {
    this.price = walk(this.price, this.ticker)

    const now            = Date.now()
    const newCandleStart = Math.floor(now / this.tfMs) * this.tfMs

    if (newCandleStart > this.candleStart) {
      // Candle closed — open a new one
      this.candleStart = newCandleStart
      this.candleOpen  = this.price
      this.candleHigh  = this.price
      this.candleLow   = this.price
    } else {
      this.candleHigh = Math.max(this.candleHigh, this.price)
      this.candleLow  = Math.min(this.candleLow,  this.price)
    }

    const pct = (this.price - this.sessionOpen) / this.sessionOpen * 100
    const p2  = parseFloat(this.price.toFixed(2))

    return {
      ticker: this.ticker,
      candle: {
        time:   Math.floor(this.candleStart / 1000),
        open:   parseFloat(this.candleOpen.toFixed(2)),
        high:   parseFloat(this.candleHigh.toFixed(2)),
        low:    parseFloat(this.candleLow.toFixed(2)),
        close:  p2,
        volume: Math.floor(Math.random() * 180_000) + 40_000,
      },
      price:   p2,
      change:  (pct >= 0 ? '+' : '') + pct.toFixed(2),
      changeP: (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%',
      up:      pct >= 0,
    }
  }
}
