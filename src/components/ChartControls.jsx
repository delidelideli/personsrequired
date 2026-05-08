import React from 'react'

const TIMEFRAMES = ['1m', '5m', '15m', '1h', 'D']

const OVERLAYS = [
  { key: 'vwap',  label: 'VWAP',   color: '#38bdf8' },
  { key: 'ema20', label: 'EMA 20', color: '#00ff88' },
  { key: 'ema50', label: 'EMA 50', color: '#f59e0b' },
]

export default function ChartControls({ timeframe, onTimeframeChange, overlays, onToggle }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e3352] bg-[#0c1119] shrink-0">

      {/* Timeframe buttons */}
      <div className="flex gap-1">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
            style={
              timeframe === tf
                ? { borderColor: '#38bdf8', color: '#38bdf8', boxShadow: '0 0 0 1px #38bdf8' }
                : { borderColor: '#1e3352', color: '#475569' }
            }
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Overlay toggles */}
      <div className="flex gap-1">
        {OVERLAYS.map(({ key, label, color }) => {
          const on = overlays?.[key]
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
              style={
                on
                  ? { borderColor: color, color, boxShadow: `0 0 0 1px ${color}` }
                  : { borderColor: '#1e3352', color: '#475569' }
              }
            >
              {label}
            </button>
          )
        })}
      </div>

    </div>
  )
}
