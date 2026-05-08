import React from 'react'

const SYMBOLS = ['SPY', 'QQQ', 'VIX', 'BTC', 'DXY']

const DEFAULTS = {
  SPY: { price: '524.83', change: '+0.23%', up: true  },
  QQQ: { price: '448.12', change: '-0.12%', up: false },
  VIX: { price: '18.42',  change: '+2.14%', up: true  },
  BTC: { price: '67420',  change: '+1.08%', up: true  },
  DXY: { price: '104.21', change: '-0.07%', up: false },
}

export default function StatusBar({ indexPrices, connected, activeTicker = 'NVDA' }) {
  const prices = indexPrices ?? DEFAULTS

  return (
    <div className="flex items-center justify-between h-7 px-3 border-b border-[#1e3352] bg-[#0c1119] shrink-0">
      <div className="flex items-center gap-5">
        {SYMBOLS.map(sym => {
          const { price, up } = prices[sym] ?? DEFAULTS[sym]
          return (
            <div key={sym} className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-600">{sym}</span>
              <span className="font-mono tabular-nums text-[10px] font-semibold" style={{ color: up ? '#00ff88' : '#ff0055' }}>
                {price}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        {/* Live connection indicator */}
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: connected ? '#00ff88' : '#334155' }}
          />
          <span className="text-[9px] font-mono text-slate-700">
            {connected ? 'LIVE' : 'DEMO'}
          </span>
        </div>

        <button
          onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${activeTicker}`, '_blank')}
          className="text-[10px] font-mono px-2 py-0.5 border border-[#1e3352] text-[#38bdf8] hover:border-[#38bdf8] transition-colors"
        >
          TV ↗
        </button>
      </div>
    </div>
  )
}
