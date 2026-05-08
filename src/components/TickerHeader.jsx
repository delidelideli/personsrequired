import React, { useState } from 'react'

const EXCHANGE_MAP = {
  NVDA: 'NASDAQ', TSLA: 'NASDAQ', META: 'NASDAQ', AAPL: 'NASDAQ',
  AMD:  'NASDAQ', QQQ:  'NASDAQ', MSFT: 'NASDAQ', GOOGL: 'NASDAQ',
  SPY:  'NYSE',   DIA:  'NYSE',   JPM:  'NYSE',   BAC:   'NYSE',
}

function isMarketOpen() {
  const now  = new Date()
  const day  = now.getDay()
  if (day === 0 || day === 6) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= 9 * 60 + 30 && mins < 16 * 60
}

export default function TickerHeader({ ticker = 'NVDA', livePrice, onSearch }) {
  const [editing, setEditing] = useState(false)
  const [input,   setInput]   = useState('')

  function handleKey(e) {
    if (e.key === 'Enter') {
      const sym = input.trim().toUpperCase()
      if (sym && onSearch) onSearch(sym)
      setInput('')
      setEditing(false)
    }
    if (e.key === 'Escape') { setEditing(false); setInput('') }
  }

  const exchange = EXCHANGE_MAP[ticker] ?? 'NASDAQ'
  const price    = livePrice?.price   ?? '—'
  const changeP  = livePrice?.changeP ?? '+0.00%'
  const up       = livePrice?.up      ?? true
  const color    = up ? '#00ff88' : '#ff0055'
  const open     = isMarketOpen()

  return (
    <div
      className="flex items-center px-3 border-b border-[#1e3352] shrink-0"
      style={{ height: '56px', backgroundColor: 'rgba(255,255,255,0.01)' }}
    >
      {/* Left — ticker + exchange */}
      <div className="flex flex-col justify-center min-w-0 mr-3">
        {editing ? (
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKey}
            onBlur={() => { setEditing(false); setInput('') }}
            placeholder="SEARCH"
            className="w-20 bg-transparent border-b border-[#38bdf8] text-[11px] font-mono text-slate-200 focus:outline-none uppercase placeholder:text-slate-700"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono font-semibold text-slate-400 hover:text-slate-200 transition-colors text-left"
            title="Click to search"
          >
            {ticker}
          </button>
        )}
        <span
          className="text-[8px] font-mono mt-0.5 px-1 py-px w-fit"
          style={{ color: '#475569', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid #1e3352' }}
        >
          {exchange}
        </span>
      </div>

      {/* Center — hero price */}
      <div
        className="font-mono tabular-nums font-bold leading-none"
        style={{ fontSize: '28px', color, letterSpacing: '-0.02em' }}
      >
        {typeof price === 'number' ? price.toFixed(2) : price}
      </div>

      <div className="flex-1" />

      {/* Right — change + market status */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <span className="text-sm leading-none" style={{ color }}>{up ? '↗' : '↘'}</span>
          <span className="font-mono tabular-nums text-sm font-semibold" style={{ color }}>
            {changeP}
          </span>
        </div>
        <span
          className="text-[8px] font-mono px-1.5 py-px"
          style={
            open
              ? { color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }
              : { color: '#475569', backgroundColor: 'transparent', border: '1px solid #1e3352' }
          }
        >
          {open ? '● OPEN' : '○ CLOSED'}
        </span>
      </div>
    </div>
  )
}
