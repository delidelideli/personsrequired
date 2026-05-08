import React, { useState } from 'react'

const EXCHANGE_MAP = {
  NVDA: 'NASDAQ', TSLA: 'NASDAQ', META: 'NASDAQ', AAPL: 'NASDAQ',
  AMD:  'NASDAQ', QQQ:  'NASDAQ', MSFT: 'NASDAQ', GOOGL: 'NASDAQ',
  SPY:  'NYSE',   DIA:  'NYSE',   JPM:  'NYSE',   BAC:  'NYSE',
}

function isMarketOpen() {
  const now = new Date()
  const day = now.getDay()
  if (day === 0 || day === 6) return false
  const h = now.getHours(), m = now.getMinutes()
  const mins = h * 60 + m
  return mins >= 9 * 60 + 30 && mins < 16 * 60
}

export default function TickerHeader({ ticker = 'NVDA', livePrice, onSearch }) {
  const [input, setInput] = useState('')

  function handleKey(e) {
    if (e.key !== 'Enter') return
    const sym = input.trim().toUpperCase()
    if (sym && onSearch) onSearch(sym)
    setInput('')
  }

  const exchange = EXCHANGE_MAP[ticker] ?? 'NASDAQ'
  const price    = livePrice?.price   ?? '—'
  const changeP  = livePrice?.changeP ?? '+0.00%'
  const change   = livePrice?.change  ?? '+0.00'
  const up       = livePrice?.up      ?? true
  const color    = up ? '#00ff88' : '#ff0055'
  const arrow    = up ? '▲' : '▼'
  const open     = isMarketOpen()

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-[#1e3352] shrink-0">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value.toUpperCase())}
        onKeyDown={handleKey}
        placeholder="SEARCH"
        className="w-20 bg-transparent border border-[#1e3352] px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-[#38bdf8] uppercase placeholder:text-slate-700 transition-colors"
      />

      <span className="text-[9px] px-1.5 py-0.5 border border-[#1e3352] text-slate-600 font-mono">
        {exchange}
      </span>

      <span className="text-sm font-mono font-semibold text-slate-100">{ticker}</span>

      <span className="font-mono tabular-nums text-xl font-semibold" style={{ color }}>
        {typeof price === 'number' ? price.toFixed(2) : price}
      </span>

      <div className="flex items-center gap-1">
        <span className="text-xs leading-none" style={{ color }}>{arrow}</span>
        <span className="font-mono tabular-nums text-xs" style={{ color }}>
          {change} ({changeP})
        </span>
      </div>

      <div className="flex-1" />

      <span
        className="text-[9px] font-mono px-2 py-0.5 border"
        style={
          open
            ? { color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.3)' }
            : { color: '#475569', backgroundColor: 'transparent', borderColor: '#1e3352' }
        }
      >
        {open ? '● OPEN' : '○ CLOSED'}
      </span>
    </div>
  )
}
