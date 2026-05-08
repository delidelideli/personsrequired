import React from 'react'

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', 'D', 'W']

export default function TimeframeTray({
  timeframe,
  onTimeframeChange,
  frozen,
  onFreeze,
  onToggleOverlay,
  overlayOpen,
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-t border-[#1e3352] shrink-0">
      {TIMEFRAMES.map(tf => (
        <button
          key={tf}
          onClick={() => onTimeframeChange(tf)}
          className="hw-switch"
          style={
            timeframe === tf
              ? { borderColor: '#38bdf8', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.07)', boxShadow: '0 0 0 1px #38bdf8' }
              : {}
          }
        >
          {tf}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onFreeze}
        className={`hw-switch ${frozen ? 'hw-on-blue' : ''}`}
      >
        {frozen ? '▶ RESUME' : '⏸ PAUSE'}
      </button>

      <button
        onClick={onToggleOverlay}
        className={`hw-switch ${overlayOpen ? 'hw-on-blue' : ''}`}
      >
        ⚙
      </button>
    </div>
  )
}
