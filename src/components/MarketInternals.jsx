import React, { useState, useEffect } from 'react'

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }

function genState() {
  return {
    tick:    Math.floor(Math.random() * 2400) - 1200,
    trin:    parseFloat((Math.random() * 2 + 0.4).toFixed(2)),
    pc:      parseFloat((Math.random() * 0.8 + 0.5).toFixed(2)),
    adv:     Math.floor(Math.random() * 1200) + 800,
    dec:     Math.floor(Math.random() * 1200) + 400,
    vix:     parseFloat((Math.random() * 8 + 13).toFixed(2)),
    vixUp:   Math.random() > 0.5,
  }
}

function walk(prev) {
  const tick = clamp(prev.tick + (Math.random() * 160 - 80), -1200, 1200)
  const trin = clamp(parseFloat((prev.trin + (Math.random() * 0.12 - 0.06)).toFixed(2)), 0.4, 3.2)
  const pc   = clamp(parseFloat((prev.pc   + (Math.random() * 0.06 - 0.03)).toFixed(2)), 0.4, 1.8)
  const advD = Math.floor(Math.random() * 40 - 20)
  const decD = Math.floor(Math.random() * 40 - 20)
  const adv  = clamp(prev.adv + advD, 200, 2800)
  const dec  = clamp(prev.dec + decD, 200, 2800)
  const vix  = clamp(parseFloat((prev.vix + (Math.random() * 0.2 - 0.1)).toFixed(2)), 10, 40)
  return { tick, trin, pc, adv, dec, vix, vixUp: vix >= prev.vix }
}

function Bar({ pct, color }) {
  return (
    <div className="w-full h-[3px] bg-[#1a2535] mt-1">
      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="px-2 py-2 border-b border-[#1e3352]">
      <div className="text-[8px] font-mono text-slate-700 uppercase tracking-widest mb-1">{label}</div>
      {children}
    </div>
  )
}

export default function MarketInternals() {
  const [d, setD] = useState(genState)

  useEffect(() => {
    const t = setInterval(() => setD(prev => walk(prev)), 2500)
    return () => clearInterval(t)
  }, [])

  const tickColor  = d.tick >= 0 ? '#00ff88' : '#ff0055'
  const tickPct    = clamp(((d.tick + 1200) / 2400) * 100, 0, 100)

  const trinColor  = d.trin < 1 ? '#00ff88' : d.trin < 1.5 ? '#f59e0b' : '#ff0055'
  const trinPct    = clamp(((d.trin - 0.4) / 2.8) * 100, 0, 100)

  const pcColor    = d.pc < 0.8 ? '#00ff88' : d.pc < 1.1 ? '#f59e0b' : '#ff0055'
  const pcPct      = clamp(((d.pc - 0.4) / 1.4) * 100, 0, 100)

  const total      = d.adv + d.dec
  const advPct     = (d.adv / total) * 100
  const adColor    = advPct >= 55 ? '#00ff88' : advPct <= 45 ? '#ff0055' : '#f59e0b'

  const vixColor   = d.vixUp ? '#ff0055' : '#00ff88'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-2 py-1.5 border-b border-[#1e3352] shrink-0">
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Internals</span>
      </div>

      <Row label="NYSE TICK">
        <div className="flex items-baseline justify-between">
          <span className="text-[18px] font-mono font-bold tabular-nums leading-none" style={{ color: tickColor }}>
            {d.tick > 0 ? '+' : ''}{d.tick}
          </span>
          <span className="text-[8px] font-mono text-slate-700">
            {Math.abs(d.tick) > 1000 ? 'EXTREME' : Math.abs(d.tick) > 600 ? 'STRONG' : 'NEUTRAL'}
          </span>
        </div>
        <Bar pct={tickPct} color={tickColor} />
      </Row>

      <Row label="TRIN">
        <div className="flex items-baseline justify-between">
          <span className="text-[18px] font-mono font-bold tabular-nums leading-none" style={{ color: trinColor }}>
            {d.trin.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono text-slate-700">
            {d.trin < 1 ? 'BULLISH' : d.trin < 1.5 ? 'NEUTRAL' : 'BEARISH'}
          </span>
        </div>
        <Bar pct={trinPct} color={trinColor} />
      </Row>

      <Row label="PUT / CALL">
        <div className="flex items-baseline justify-between">
          <span className="text-[18px] font-mono font-bold tabular-nums leading-none" style={{ color: pcColor }}>
            {d.pc.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono text-slate-700">
            {d.pc < 0.8 ? 'CALLS' : d.pc > 1.1 ? 'PUTS' : 'MIXED'}
          </span>
        </div>
        <Bar pct={pcPct} color={pcColor} />
      </Row>

      <Row label="ADV / DEC">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tabular-nums text-[#00ff88]">↑ {d.adv.toLocaleString()}</span>
            <span className="text-[8px] font-mono text-slate-700">{advPct.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tabular-nums text-[#ff0055]">↓ {d.dec.toLocaleString()}</span>
          </div>
          <Bar pct={advPct} color={adColor} />
        </div>
      </Row>

      <Row label="VIX">
        <div className="flex items-baseline justify-between">
          <span className="text-[18px] font-mono font-bold tabular-nums leading-none" style={{ color: vixColor }}>
            {d.vix.toFixed(2)}
          </span>
          <span className="text-[8px] font-mono" style={{ color: vixColor }}>
            {d.vixUp ? '↑' : '↓'}
          </span>
        </div>
        <Bar pct={clamp(((d.vix - 10) / 30) * 100, 0, 100)} color={vixColor} />
      </Row>
    </div>
  )
}
