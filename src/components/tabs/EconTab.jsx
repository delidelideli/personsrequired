import React from 'react'

const EVENTS = [
  { time: '8:30',  name: 'CPI m/m',               impact: 'HIGH', prev: '0.4%',  forecast: '0.3%',  actual: '0.3%',  released: true,  next: false },
  { time: '8:30',  name: 'Core CPI y/y',           impact: 'HIGH', prev: '3.8%',  forecast: '3.7%',  actual: '3.7%',  released: true,  next: false },
  { time: '10:00', name: 'ISM Services PMI',        impact: 'MED',  prev: '52.6',  forecast: '52.8',  actual: null,    released: false, next: true  },
  { time: '14:00', name: 'FOMC Minutes',            impact: 'HIGH', prev: '—',     forecast: '—',     actual: null,    released: false, next: false },
  { time: '8:30',  name: 'PPI m/m',                impact: 'MED',  prev: '0.2%',  forecast: '0.3%',  actual: null,    released: false, next: false },
  { time: '8:30',  name: 'Core PCE',               impact: 'HIGH', prev: '2.8%',  forecast: '2.7%',  actual: null,    released: false, next: false },
  { time: '8:30',  name: 'Unemployment Claims',     impact: 'MED',  prev: '217K',  forecast: '215K',  actual: null,    released: false, next: false },
  { time: '10:00', name: 'UoM Consumer Sentiment',  impact: 'LOW',  prev: '67.4',  forecast: '68.0',  actual: null,    released: false, next: false },
]

const IMPACT_COLOR = { HIGH: '#ff0055', MED: '#f59e0b', LOW: '#38bdf8' }

export default function EconTab() {
  return (
    <div>
      <div className="px-3 py-1.5 border-b border-[#1e3352]">
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Thu, May 7 2026</span>
      </div>

      {EVENTS.map((ev, i) => (
        <div
          key={i}
          className="px-3 py-2 border-b border-[#1e3352] transition-colors"
          style={ev.next ? { backgroundColor: 'rgba(56,189,248,0.05)' } : {}}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono text-slate-600">{ev.time} AM</span>
            <span
              className="text-[8px] font-mono px-1 py-px border"
              style={{ color: IMPACT_COLOR[ev.impact], borderColor: IMPACT_COLOR[ev.impact] + '40' }}
            >
              {ev.impact}
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-300 mb-1">{ev.name}</div>

          <div className="flex gap-3">
            <span className="text-[9px] font-mono text-slate-700">P: {ev.prev}</span>
            <span className="text-[9px] font-mono text-slate-700">F: {ev.forecast}</span>
            {ev.actual
              ? <span className="text-[9px] font-mono text-[#00ff88]">A: {ev.actual}</span>
              : <span className="text-[9px] font-mono text-slate-800">A: —</span>
            }
          </div>
        </div>
      ))}
    </div>
  )
}
