import React from 'react'

// Maps overlay state keys → display labels and active neon colors
const AVERAGES = [
  { key: 'ema20',  label: 'EMA 20',  color: '#00ff88' },
  { key: 'ema50',  label: 'EMA 50',  color: '#f59e0b' },
  { key: 'ema200', label: 'EMA 200', color: '#a855f7' },
]

const LEVELS = [
  { key: 'vwap', label: 'VWAP', color: '#38bdf8' },
  { key: 'pdh',  label: 'PDH',  color: '#ff0055' },
  { key: 'pmh',  label: 'PMH',  color: '#ff0055' },
  { key: 'pdl',  label: 'PDL',  color: '#38bdf8' },
  { key: 'pml',  label: 'PML',  color: '#38bdf8' },
]

// Phase 2 placeholders — no overlay key, not toggleable yet
const EXTRAS = ['Vol Profile', 'RSI', 'MACD', 'BB']

function Pill({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="hw-switch"
      style={
        active
          ? { borderColor: color, color, boxShadow: `0 0 0 1px ${color}` }
          : {}
      }
    >
      {label}
    </button>
  )
}

export default function OverlaySettings({ overlays, onToggle }) {
  return (
    <div className="flex gap-6 px-3 py-2 border-t border-[#1e3352] bg-[#0c1119] shrink-0">
      <div>
        <div className="td-label mb-1.5">Averages</div>
        <div className="flex gap-1">
          {AVERAGES.map(({ key, label, color }) => (
            <Pill
              key={key}
              label={label}
              active={overlays[key]}
              color={color}
              onClick={() => onToggle(key)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="td-label mb-1.5">Levels</div>
        <div className="flex gap-1">
          {LEVELS.map(({ key, label, color }) => (
            <Pill
              key={key}
              label={label}
              active={overlays[key]}
              color={color}
              onClick={() => onToggle(key)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="td-label mb-1.5">Extras</div>
        <div className="flex gap-1">
          {EXTRAS.map(label => (
            <button key={label} className="hw-switch" disabled style={{ opacity: 0.3, cursor: 'default' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
