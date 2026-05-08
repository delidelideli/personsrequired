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
    <div className="flex flex-col shrink-0">
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1e3352]">
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Watchlist</span>
        <button
          onClick={() => setAdding(v => !v)}
          className="text-[11px] text-[#38bdf8] hover:text-[#38bdf8]/70 transition-colors leading-none"
        >
          {adding ? '✕' : '+'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAddSubmit} className="flex border-b border-[#1e3352]">
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

      {tickers.map(symbol => {
        const isActive = symbol === activeTicker
        const def      = DEFAULTS[symbol] ?? FALLBACK
        const live     = isActive && livePrice ? livePrice : null
        const price    = live ? String(live.price) : def.price
        const up       = live ? live.up            : def.up
        const strength = def.strength

        return (
          <button
            key={symbol}
            onClick={() => onSelect?.(symbol)}
            className="flex flex-col px-2 pt-2 pb-1.5 border-b border-[#1e3352] transition-colors text-left w-full"
            style={isActive ? { backgroundColor: 'rgba(255,255,255,0.03)' } : {}}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span
                className="text-[11px] font-mono font-bold"
                style={{ color: isActive ? '#e2e8f0' : '#94a3b8' }}
              >
                {symbol}
              </span>
              <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-200">
                {typeof price === 'number' ? price.toFixed(2) : price}
              </span>
            </div>
            <div className="w-full h-[3px] bg-[#1a2535]">
              <div
                className="h-full"
                style={{ width: `${strength}%`, backgroundColor: up ? '#00ff88' : '#ff0055' }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
