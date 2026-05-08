import React, { useState, useEffect, useRef } from 'react'

// ── Signal generator ────────────────────────────────────────────────────────
const TICKERS  = ['NVDA', 'TSLA', 'META', 'AAPL', 'SPY', 'AMD']
const TYPES    = ['SWEEP', 'SWEEP', 'SWEEP', 'BLOCK', 'SPLIT']
const EXPIRIES = ['5/17', '5/24', '5/31', '6/21']

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

function genEvent() {
  const ticker  = pick(TICKERS)
  const type    = pick(TYPES)
  const isSplit = type === 'SPLIT'
  const bull    = isSplit ? null : Math.random() > 0.45
  const strike  = pick(STRIKES[ticker] ?? [100])
  const side    = isSplit ? (Math.random() > 0.5 ? 'C' : 'P') : (bull ? 'C' : 'P')
  const sizeVal = Math.floor(Math.random() * 1_150_000) + 50_000

  return {
    id:       `${Date.now()}-${Math.random()}`,
    ticker, type, bull, sizeVal,
    contract: `${strike}${side} ${pick(EXPIRIES)}`,
    price:    '$' + (Math.random() * 9 + 0.5).toFixed(2),
    size:     fmtSize(sizeVal),
    ts:       new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}

// ── Constants ───────────────────────────────────────────────────────────────
const BORDER_COLOR = { true: '#00ff88', false: '#ff0055', null: '#f59e0b' }
const TYPE_COLOR   = { SWEEP: '#00ff88', BLOCK: '#38bdf8', SPLIT: '#f59e0b' }
const MAX_EVENTS   = 60

function parseFilterThreshold(label) {
  const m = String(label).match(/\$(\d+(?:\.\d+)?)(k|K|m|M)?\+/)
  if (!m) return 100_000
  const n = parseFloat(m[1])
  const u = m[2]?.toLowerCase()
  if (u === 'm') return Math.round(n * 1_000_000)
  if (u === 'k') return Math.round(n * 1_000)
  return Math.round(n)
}

const SEED = Array.from({ length: 8 }, genEvent)

// ── Single row ──────────────────────────────────────────────────────────────
function TapeRow({ event }) {
  const borderColor = BORDER_COLOR[String(event.bull)]
  const typeColor   = TYPE_COLOR[event.type] ?? '#64748b'
  const sizeColor   = event.bull === true ? '#00ff88' : event.bull === false ? '#ff0055' : '#f59e0b'

  return (
    <div
      className="flex flex-col px-2 py-1.5 border-b border-[#1e3352] border-l-2 hover:bg-white/[0.02] transition-colors"
      style={{ borderLeftColor: borderColor }}
    >
      {/* Row 1: ticker + type badge | size */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold text-slate-200">{event.ticker}</span>
          <span
            className="text-[8px] font-mono px-1 py-px border"
            style={{ color: typeColor, borderColor: typeColor + '55', backgroundColor: typeColor + '14' }}
          >
            {event.type}
          </span>
        </div>
        <span className="text-[10px] font-mono tabular-nums font-semibold" style={{ color: sizeColor }}>
          {event.size}
        </span>
      </div>

      {/* Row 2: contract | price | timestamp */}
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] font-mono text-slate-600">{event.contract}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono tabular-nums text-slate-500">{event.price}</span>
          <span className="text-[8px] font-mono text-slate-800">{event.ts}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function FlowTab({ flowFilter = '$50k+' }) {
  const [events, setEvents] = useState(SEED)
  const [buffer, setBuffer] = useState([])
  const [paused, setPaused] = useState(false)

  // Refs so the interval closure always reads current values without re-mounting
  const pausedRef = useRef(false)
  const bufferRef = useRef([])

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { bufferRef.current = buffer  }, [buffer])

  // Simulate a new signal every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const ev = genEvent()
      if (pausedRef.current) {
        setBuffer(prev => [ev, ...prev])
      } else {
        setEvents(prev => [ev, ...prev].slice(0, MAX_EVENTS))
      }
    }, 2000)
    return () => clearInterval(id)
  }, [])

  function handleToggle() {
    if (paused) {
      // Flush buffer → inject at top of tape
      const captured = bufferRef.current
      setEvents(prev => [...captured, ...prev].slice(0, MAX_EVENTS))
      setBuffer([])
    }
    setPaused(v => !v)
  }

  const minSize = parseFilterThreshold(flowFilter)
  const visibleEvents = events.filter(ev => ev.sizeVal >= minSize)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e3352] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">The Tape</span>
          {paused && buffer.length > 0 && (
            <span className="text-[8px] font-mono text-[#f59e0b] tabular-nums">
              +{buffer.length}
            </span>
          )}
        </div>

        <button
          onClick={handleToggle}
          className="text-[9px] font-mono px-2 py-0.5 border transition-all duration-100"
          style={
            paused
              ? { borderColor: '#38bdf8', color: '#38bdf8', boxShadow: '0 0 0 1px #38bdf8' }
              : { borderColor: '#1e3352', color: '#475569' }
          }
        >
          {paused ? '▶ PLAY' : '⏸ PAUSE'}
        </button>
      </div>

      {/* ── Tape list + freeze overlay ──────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto">
          {visibleEvents.map(ev => <TapeRow key={ev.id} event={ev} />)}
          {visibleEvents.length === 0 && (
            <div className="px-3 py-4 text-[9px] font-mono text-slate-700">No flow above {flowFilter}</div>
          )}
        </div>

        {/* Freeze overlay — sits over list only, header stays interactive */}
        {paused && (
          <div className="absolute inset-0 z-10 pointer-events-none freeze-stripe flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 bg-[#0c1119]/75 px-4 py-2.5 border border-[#1e3352]">
              <span className="text-[10px] font-mono text-[#38bdf8]">⏸ PAUSED</span>
              {buffer.length > 0 ? (
                <span className="text-[9px] font-mono tabular-nums text-[#f59e0b]">
                  {buffer.length} signal{buffer.length !== 1 ? 's' : ''} buffered
                </span>
              ) : (
                <span className="text-[9px] font-mono text-slate-700">waiting for signals…</span>
              )}
              <span className="text-[8px] font-mono text-slate-800 mt-0.5">press PLAY to inject</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
