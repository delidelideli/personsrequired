import React, { useState } from 'react'

// Static seed data — shown for non-active tickers while only one stream is open
const DEFAULTS = {
  NVDA: { price: '924.50', change: '+1.35%', strength: 82, up: true  },
  TSLA: { price: '248.12', change: '-0.87%', strength: 35, up: false },
  META: { price: '512.33', change: '+0.62%', strength: 65, up: true  },
  AAPL: { price: '189.67', change: '+0.14%', strength: 54, up: true  },
  SPY:  { price: '524.83', change: '+0.23%', strength: 58, up: true  },
  AMD:  { price: '172.44', change: '-1.23%', strength: 28, up: false },
}
const FALLBACK = { price: '—', change: '—', strength: 50, up: true }

export default function Watchlist({ tickers, activeTicker, onSelect, onAdd, livePrice }) {
  const [adding,   setAdding]   = useState(false)
  const [addInput, setAddInput] = useState('')

  function handleAddSubmit(e) {
    e.preventDefault()
    const sym = addInput.trim().toUpperCase()
    if (sym && !tickers.includes(sym)) onAdd?.(sym)
    setAdding(false)
    setAddInput('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1e3352] shrink-0 bg-[#0c1119]">
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Watchlist</span>
        <button
          onClick={() => setAdding(v => !v)}
          className="text-[11px] text-[#38bdf8] hover:text-[#38bdf8]/70 transition-colors leading-none"
        >
          {adding ? '✕' : '+'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAddSubmit} className="flex border-b border-[#1e3352] shrink-0 bg-[#0c1119]">
          <input
            autoFocus
            value={addInput}
            onChange={e => setAddInput(e.target.value.toUpperCase())}
            placeholder="SYMBOL"
            className="flex-1 bg-transparent px-2 py-1.5 text-[10px] font-mono text-slate-200 focus:outline-none placeholder:text-slate-700 uppercase"
          />
          <button
            type="submit"
            className="px-2 text-[9px] font-mono text-[#38bdf8] border-l border-[#1e3352] hover:bg-[#38bdf8]/10 transition-colors"
          >
            ADD
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
      {tickers.map(symbol => {
        const isActive = symbol === activeTicker
        const def      = DEFAULTS[symbol] ?? FALLBACK
        const live     = isActive && livePrice ? livePrice : null
        const price    = live ? String(live.price) : def.price
        const change   = live ? live.changeP      : def.change
        const up       = live ? live.up            : def.up
        const strength = def.strength

        return (
          <button
            key={symbol}
            onClick={() => onSelect?.(symbol)}
            className="flex flex-col px-2 py-1.5 border-b border-[#1e3352] transition-colors text-left w-full"
            style={
              isActive
                ? { backgroundColor: 'rgba(56,189,248,0.07)', borderLeft: '2px solid #38bdf8' }
                : { borderLeft: '2px solid transparent' }
            }
          >
            <div className="flex items-center justify-between w-full">
              <span
                className="text-[10px] font-mono font-semibold"
                style={{ color: isActive ? '#38bdf8' : '#cbd5e1' }}
              >
                {symbol}
              </span>
              <span className="text-[10px] font-mono tabular-nums" style={{ color: up ? '#00ff88' : '#ff0055' }}>
                {change}
              </span>
            </div>
            <div className="flex items-center justify-between w-full mt-0.5">
              <span className="text-[10px] font-mono tabular-nums text-slate-500">{price}</span>
              <div className="w-10 h-1 bg-[#1e3352] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${strength}%`, backgroundColor: up ? '#00ff88' : '#ff0055' }}
                />
              </div>
            </div>
          </button>
        )
      })}
      </div>
    </div>
  )
}
