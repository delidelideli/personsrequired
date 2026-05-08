import React from 'react'

const FLOW_DATA = [
  { ticker: 'NVDA', contract: '930C 5/17', price: '$2.45', size: '$892K', sizeVal: 892_000,  type: 'SWEEP', bull: true  },
  { ticker: 'SPY',  contract: '526P 5/17', price: '$1.12', size: '$445K', sizeVal: 445_000,  type: 'BLOCK', bull: false },
  { ticker: 'TSLA', contract: '250C 5/24', price: '$3.80', size: '$1.2M', sizeVal: 1_200_000, type: 'SWEEP', bull: true  },
  { ticker: 'AAPL', contract: '190P 5/17', price: '$0.88', size: '$78K',  sizeVal: 78_000,   type: 'SPLIT', bull: null  },
  { ticker: 'META', contract: '515C 5/31', price: '$5.20', size: '$620K', sizeVal: 620_000,  type: 'SWEEP', bull: true  },
]

const FILTERS = [
  { label: '$100K+', threshold: 100_000   },
  { label: '$500K+', threshold: 500_000   },
  { label: '$1M+',   threshold: 1_000_000 },
]

const LEFT_BORDER = { true: '#00ff88', false: '#ff0055', null: '#f59e0b' }
const TYPE_COLOR  = { SWEEP: '#00ff88', BLOCK: '#38bdf8', SPLIT: '#f59e0b' }

export default function FlowPanel({ frozen, liveFlows = [], flowFilter, onFlowFilter }) {
  const threshold = FILTERS.find(f => f.label === flowFilter)?.threshold ?? 50_000
  // Merge live events (newest first) on top of static seed data, then filter
  const merged  = [...liveFlows, ...FLOW_DATA]
  const visible = merged.filter(row => row.sizeVal >= threshold).slice(0, 20)

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Header + filter row */}
      <div className="shrink-0">
        <div className="px-2 py-1 border-b border-[#1e3352]">
          <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Flow</span>
        </div>
        <div className="flex gap-1 px-2 py-1.5 border-b border-[#1e3352]">
          {FILTERS.map(({ label }) => (
            <button
              key={label}
              onClick={() => onFlowFilter(label)}
              className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
              style={
                flowFilter === label
                  ? { borderColor: '#00ff88', color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.07)', boxShadow: '0 0 0 1px #00ff88' }
                  : { borderColor: '#1e3352', color: '#475569' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Flow rows */}
      <div className="flex flex-col overflow-y-auto flex-1">
        {visible.map((row, i) => (
          <div
            key={i}
            className="flex flex-col px-2 py-1.5 border-b border-[#1e3352] border-l-2 hover:bg-white/[0.02] transition-colors"
            style={{ borderLeftColor: LEFT_BORDER[String(row.bull)] }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-slate-200">{row.ticker}</span>
              <span className="text-[9px] font-mono" style={{ color: TYPE_COLOR[row.type] }}>{row.type}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] font-mono text-slate-600">{row.contract}</span>
              <span className="text-[9px] font-mono text-slate-400">{row.size}</span>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="px-2 py-3 text-[9px] font-mono text-slate-700">No flow above {flowFilter}</div>
        )}
      </div>

      {/* Freeze overlay */}
      {frozen && (
        <div className="absolute inset-0 z-10 pointer-events-none freeze-stripe">
          <div className="absolute bottom-2 right-2 flex items-center gap-1 num-xs text-[#38bdf8] bg-[#0c1119]/80 px-1.5 py-0.5 border border-[#1e3352]">
            ⏸ FROZEN
          </div>
        </div>
      )}
    </div>
  )
}
