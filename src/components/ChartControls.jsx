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
            className="px-2.5 py-1 text-[10px] font-mono font-medium transition-all duration-100"
            style={
              timeframe === tf
                ? { backgroundColor: '#38bdf8', color: '#0c1119', borderRadius: '4px', border: '1px solid transparent' }
                : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#475569', borderRadius: '4px', border: '1px solid transparent' }
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
              className="px-2 py-1 text-[9px] font-mono transition-all duration-100"
              style={
                on
                  ? { backgroundColor: color + '22', color, borderRadius: '4px', border: `1px solid ${color}55` }
                  : { backgroundColor: 'rgba(255,255,255,0.03)', color: '#334155', borderRadius: '4px', border: '1px solid transparent' }
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
