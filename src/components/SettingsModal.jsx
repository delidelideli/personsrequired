import React, { useState } from 'react'
import { SERVER_URL } from '../lib/config'

const SECTIONS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'overlays',   label: 'Overlays'   },
  { id: 'watchlist',  label: 'Watchlist'  },
  { id: 'alerts',     label: 'Alerts'     },
  { id: 'connection', label: 'Connection' },
  { id: 'account',    label: 'Account'    },
]

const OVERLAY_LIST = [
  { key: 'vwap',   label: 'VWAP',    color: '#38bdf8', desc: 'Volume Weighted Avg Price' },
  { key: 'ema20',  label: 'EMA 20',  color: '#00ff88', desc: '20-period Exponential MA'  },
  { key: 'ema50',  label: 'EMA 50',  color: '#f59e0b', desc: '50-period Exponential MA'  },
  { key: 'ema200', label: 'EMA 200', color: '#a855f7', desc: '200-period Exponential MA' },
  { key: 'pdh',    label: 'PDH',     color: '#ff0055', desc: 'Previous Day High'          },
  { key: 'pdl',    label: 'PDL',     color: '#38bdf8', desc: 'Previous Day Low'           },
  { key: 'pmh',    label: 'PMH',     color: '#ff0055', desc: 'Previous Month High'        },
  { key: 'pml',    label: 'PML',     color: '#38bdf8', desc: 'Previous Month Low'         },
]

const FLOW_FILTERS  = ['$50k+', '$100k+', '$500k+', '$1M+']
const CHART_HEIGHTS = [{ label: 'S', px: 200 }, { label: 'M', px: 280 }, { label: 'L', px: 360 }]

function SectionLabel({ children }) {
  return <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest mb-3">{children}</p>
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e3352] gap-3">
      <span className="text-[10px] font-mono text-slate-400 shrink-0">{label}</span>
      <div className="flex items-center gap-1 flex-wrap justify-end">{children}</div>
    </div>
  )
}

function Toggle({ on, onToggle, color = '#00ff88' }) {
  return (
    <button
      onClick={onToggle}
      className="px-2 py-0.5 text-[9px] font-mono border transition-all duration-100 w-10 text-center"
      style={on
        ? { borderColor: color, color, boxShadow: `0 0 0 1px ${color}` }
        : { borderColor: '#1e3352', color: '#475569' }
      }
    >
      {on ? 'ON' : 'OFF'}
    </button>
  )
}

function Hint({ children }) {
  return <p className="text-[8px] font-mono text-slate-700 mt-3">{children}</p>
}

export default function SettingsModal({
  onClose,
  overlays, onToggleOverlay,
  watchlist, activeTicker, onRemoveTicker, onMoveTicker,
  muted, onMute,
  flowFilter, onFlowFilter,
  connected,
  chartHeight, onChartHeight,
}) {
  const [section, setSection] = useState('appearance')

  function clearSession() {
    sessionStorage.removeItem('td_token')
    window.location.reload()
  }

  function content() {
    switch (section) {

      case 'appearance': return (<>
        <SectionLabel>Display</SectionLabel>
        <Row label="Chart Height">
          {CHART_HEIGHTS.map(({ label, px }) => (
            <button
              key={px}
              onClick={() => onChartHeight(px)}
              className="px-2 py-0.5 text-[9px] font-mono border transition-all duration-100"
              style={chartHeight === px
                ? { borderColor: '#38bdf8', color: '#38bdf8', boxShadow: '0 0 0 1px #38bdf8' }
                : { borderColor: '#1e3352', color: '#475569' }
              }
            >
              {label}
            </button>
          ))}
        </Row>
        <Row label="Theme">
          <span className="text-[9px] font-mono text-slate-600">Bloomberg Dark</span>
        </Row>
        <Row label="Font">
          <span className="text-[9px] font-mono text-slate-600">JetBrains Mono</span>
        </Row>
      </>)

      case 'overlays': return (<>
        <SectionLabel>Chart Overlays</SectionLabel>
        {OVERLAY_LIST.map(({ key, label, color, desc }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-[#1e3352]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-mono shrink-0" style={{ color }}>{label}</span>
              <span className="text-[9px] font-mono text-slate-600 truncate">{desc}</span>
            </div>
            <Toggle on={!!overlays?.[key]} onToggle={() => onToggleOverlay(key)} color={color} />
          </div>
        ))}
      </>)

      case 'watchlist': return (<>
        <SectionLabel>Manage Watchlist</SectionLabel>
        {watchlist.map((sym, i) => (
          <div key={sym} className="flex items-center gap-1.5 py-1.5 border-b border-[#1e3352]">
            <span className="flex-1 text-[10px] font-mono" style={{ color: sym === activeTicker ? '#38bdf8' : '#cbd5e1' }}>
              {sym}
              {sym === activeTicker && <span className="ml-2 text-[8px] text-slate-700">ACTIVE</span>}
            </span>
            <button
              onClick={() => onMoveTicker(i, i - 1)}
              disabled={i === 0}
              className="text-[11px] text-slate-600 hover:text-slate-300 disabled:opacity-20 px-1 leading-none transition-colors"
            >↑</button>
            <button
              onClick={() => onMoveTicker(i, i + 1)}
              disabled={i === watchlist.length - 1}
              className="text-[11px] text-slate-600 hover:text-slate-300 disabled:opacity-20 px-1 leading-none transition-colors"
            >↓</button>
            <button
              onClick={() => onRemoveTicker(sym)}
              disabled={watchlist.length === 1}
              className="text-[12px] text-slate-600 hover:text-[#ff0055] disabled:opacity-20 px-1 leading-none transition-colors"
            >×</button>
          </div>
        ))}
        <Hint>Use the + button in the watchlist panel to add new tickers.</Hint>
      </>)

      case 'alerts': return (<>
        <SectionLabel>Alert Settings</SectionLabel>
        <Row label="Mute All Alerts">
          <Toggle on={muted} onToggle={onMute} color="#f59e0b" />
        </Row>
        <Row label="Flow Size Filter">
          {FLOW_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => onFlowFilter(f)}
              className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
              style={flowFilter === f
                ? { borderColor: '#00ff88', color: '#00ff88', boxShadow: '0 0 0 1px #00ff88' }
                : { borderColor: '#1e3352', color: '#475569' }
              }
            >
              {f}
            </button>
          ))}
        </Row>
        <Hint>Flow filter also applies to the FLOW tab in the right panel.</Hint>
      </>)

      case 'connection': return (<>
        <SectionLabel>Connection</SectionLabel>
        <Row label="Server">
          <span className="text-[9px] font-mono text-slate-500 truncate max-w-[200px]">{SERVER_URL}</span>
        </Row>
        <Row label="Status">
          <span
            className="text-[9px] font-mono px-2 py-0.5 border"
            style={connected
              ? { borderColor: '#00ff88', color: '#00ff88' }
              : { borderColor: '#334155',  color: '#475569' }
            }
          >
            {connected ? 'LIVE' : 'DEMO'}
          </span>
        </Row>
        <Row label="Session Token">
          <button
            onClick={clearSession}
            className="text-[9px] font-mono px-2 py-0.5 border border-[#ff0055] text-[#ff0055] hover:bg-[#ff0055]/10 transition-colors"
          >
            CLEAR &amp; RELOAD
          </button>
        </Row>
        <Hint>Clearing the session forces a fresh login on next load.</Hint>
      </>)

      case 'account': return (<>
        <SectionLabel>Account</SectionLabel>
        <Row label="Plan">
          <span className="text-[9px] font-mono px-2 py-0.5 border border-[#a855f7] text-[#a855f7]">PRO</span>
        </Row>
        <Row label="Email">
          <span className="text-[9px] font-mono text-slate-500">test@tradedesk.io</span>
        </Row>
        <Row label="Sign Out">
          <button
            onClick={clearSession}
            className="text-[9px] font-mono px-2 py-0.5 border border-[#1e3352] text-slate-600 hover:border-[#ff0055] hover:text-[#ff0055] transition-colors"
          >
            SIGN OUT
          </button>
        </Row>
        <Hint>Auth is in demo mode — real login is a future phase.</Hint>
      </>)

      default: return null
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1119]/80"
      onMouseDown={onClose}
    >
      <div
        className="flex flex-col bg-[#0c1119] border border-[#1e3352] w-[560px] max-h-[500px] overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e3352] shrink-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Settings</span>
          <button
            onClick={onClose}
            className="text-[14px] text-slate-600 hover:text-slate-300 transition-colors leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left nav */}
          <div className="w-32 shrink-0 border-r border-[#1e3352] py-1 overflow-y-auto">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className="w-full text-left px-3 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors"
                style={section === id
                  ? { color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.07)', borderLeft: '2px solid #38bdf8' }
                  : { color: '#475569', borderLeft: '2px solid transparent' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 px-4 py-3 overflow-y-auto">
            {content()}
          </div>
        </div>
      </div>
    </div>
  )
}
