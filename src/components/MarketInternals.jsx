import React, { useState, useEffect } from 'react'

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }

function genState() {
  return {
    tick:  Math.floor(Math.random() * 2400) - 1200,
    trin:  parseFloat((Math.random() * 2 + 0.4).toFixed(2)),
    pc:    parseFloat((Math.random() * 0.8 + 0.5).toFixed(2)),
    adv:   Math.floor(Math.random() * 1200) + 800,
    dec:   Math.floor(Math.random() * 1200) + 400,
    vix:   parseFloat((Math.random() * 8 + 13).toFixed(2)),
    vixUp: Math.random() > 0.5,
  }
}

function walk(prev) {
  const tick = clamp(prev.tick + (Math.random() * 160 - 80), -1200, 1200)
  const trin = clamp(parseFloat((prev.trin + (Math.random() * 0.12 - 0.06)).toFixed(2)), 0.4, 3.2)
  const pc   = clamp(parseFloat((prev.pc   + (Math.random() * 0.06 - 0.03)).toFixed(2)), 0.4, 1.8)
  const adv  = clamp(prev.adv + Math.floor(Math.random() * 40 - 20), 200, 2800)
  const dec  = clamp(prev.dec + Math.floor(Math.random() * 40 - 20), 200, 2800)
  const vix  = clamp(parseFloat((prev.vix + (Math.random() * 0.2 - 0.1)).toFixed(2)), 10, 40)
  return { tick, trin, pc, adv, dec, vix, vixUp: vix >= prev.vix }
}

function MetricRow({ label, primary, secondary, pct, color }) {
  return (
    <div className="px-2 py-1.5 border-b border-[#1e3352]">
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-mono tabular-nums" style={{ color }}>{primary}</span>
          {secondary && <span className="text-[8px] font-mono text-slate-600">{secondary}</span>}
        </div>
      </div>
      <div className="w-full h-1 bg-[#1e3352] rounded-full overflow-hidden mt-0.5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function MarketInternals() {
  const [d, setD] = useState(genState)

  useEffect(() => {
    const t = setInterval(() => setD(prev => walk(prev)), 2500)
    return () => clearInterval(t)
  }, [])

  const tickColor = d.tick >= 0 ? '#00ff88' : '#ff0055'
  const tickPct   = clamp(((d.tick + 1200) / 2400) * 100, 0, 100)
  const tickLabel = Math.abs(d.tick) > 1000 ? 'EXTR' : Math.abs(d.tick) > 600 ? 'STR' : 'NEUT'

  const trinColor = d.trin < 1 ? '#00ff88' : d.trin < 1.5 ? '#f59e0b' : '#ff0055'
  const trinPct   = clamp(((d.trin - 0.4) / 2.8) * 100, 0, 100)
  const trinLabel = d.trin < 1 ? 'BULL' : d.trin < 1.5 ? 'NEUT' : 'BEAR'

  const pcColor = d.pc < 0.8 ? '#00ff88' : d.pc < 1.1 ? '#f59e0b' : '#ff0055'
  const pcPct   = clamp(((d.pc - 0.4) / 1.4) * 100, 0, 100)
  const pcLabel = d.pc < 0.8 ? 'CALLS' : d.pc > 1.1 ? 'PUTS' : 'MIX'

  const total  = d.adv + d.dec
  const advPct = (d.adv / total) * 100
  const adColor = advPct >= 55 ? '#00ff88' : advPct <= 45 ? '#ff0055' : '#f59e0b'

  const vixColor = d.vixUp ? '#ff0055' : '#00ff88'
  const vixPct   = clamp(((d.vix - 10) / 30) * 100, 0, 100)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-2 py-1 border-b border-[#1e3352] shrink-0 bg-[#0c1119]">
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Internals</span>
      </div>

      <MetricRow
        label="NYSE TICK"
        primary={(Math.abs(d.tick) / 1000).toFixed(3)}
        secondary={tickLabel}
        pct={tickPct}
        color={tickColor}
      />
      <MetricRow
        label="TRIN"
        primary={d.trin.toFixed(2)}
        secondary={trinLabel}
        pct={trinPct}
        color={trinColor}
      />
      <MetricRow
        label="PUT / CALL"
        primary={d.pc.toFixed(2)}
        secondary={pcLabel}
        pct={pcPct}
        color={pcColor}
      />
      <MetricRow
        label="ADV / DEC"
        primary={`${d.adv.toLocaleString()} / ${d.dec.toLocaleString()}`}
        secondary={`${advPct.toFixed(0)}%`}
        pct={advPct}
        color={adColor}
      />
      <MetricRow
        label="VIX"
        primary={d.vix.toFixed(2)}
        secondary={d.vixUp ? '↑' : '↓'}
        pct={vixPct}
        color={vixColor}
      />
    </div>
  )
}
