// Generates realistic-looking options sweep / block / split events.

const TICKERS  = ['NVDA', 'TSLA', 'META', 'AAPL', 'SPY', 'AMD']
const TYPES    = ['SWEEP', 'SWEEP', 'SWEEP', 'BLOCK', 'SPLIT']   // sweeps most common
const EXPIRIES = ['5/17', '5/24', '5/31', '6/7', '6/21']

const STRIKES = {
  NVDA: [910, 920, 930, 940, 950],
  TSLA: [240, 245, 250, 255, 260],
  META: [500, 505, 510, 515, 520],
  AAPL: [185, 187, 190, 192, 195],
  SPY:  [518, 520, 522, 524, 526],
  AMD:  [160, 165, 168, 170, 175],
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function fmtSize(val) {
  if (val >= 1_000_000) return '$' + (val / 1_000_000).toFixed(1) + 'M'
  return '$' + Math.round(val / 1_000) + 'K'
}

function generateEvent() {
  const ticker  = pick(TICKERS)
  const type    = pick(TYPES)
  const isSplit = type === 'SPLIT'
  const bull    = isSplit ? null : Math.random() > 0.45
  const strike  = pick(STRIKES[ticker] ?? [100])
  const side    = isSplit ? (Math.random() > 0.5 ? 'C' : 'P') : (bull ? 'C' : 'P')
  const expiry  = pick(EXPIRIES)
  const sizeVal = Math.floor(Math.random() * 1_150_000) + 50_000

  return {
    ticker,
    contract: `${strike}${side} ${expiry}`,
    price:    '$' + (Math.random() * 9 + 0.5).toFixed(2),
    size:     fmtSize(sizeVal),
    sizeVal,
    type,
    bull,
    ts: Date.now(),
  }
}

// Emits a flow_event every 5–15 seconds while the socket is open.
export function startFlowStream(socket) {
  let timer = null

  function scheduleNext() {
    const delay = Math.floor(Math.random() * 10_000) + 5_000
    timer = setTimeout(() => {
      if (socket.connected) {
        socket.emit('flow_event', generateEvent())
        scheduleNext()
      }
    }, delay)
  }

  scheduleNext()
  return () => clearTimeout(timer)
}
