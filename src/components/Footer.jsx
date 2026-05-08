import React, { useState, useEffect } from 'react'

function fmtClock(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export default function Footer({ frozen, onFreeze, onDetach, iosSync, onIosSync }) {
  const [muted, setMuted] = useState(false)
  const [clock, setClock] = useState(() => fmtClock(new Date()))

  useEffect(() => {
    const t = setInterval(() => setClock(fmtClock(new Date())), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex items-center gap-3 px-3 h-9 border-t border-[#1e3352] bg-[#0c1119] shrink-0">

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#00ff88' }} />
        <span className="text-[10px] font-mono text-slate-500">Live</span>
      </div>

      {/* Pause / Play button — filled solid */}
      <button
        onClick={onFreeze}
        className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-medium transition-all duration-100"
        style={
          frozen
            ? { backgroundColor: '#38bdf8', color: '#0c1119', borderRadius: '4px' }
            : { backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '4px' }
        }
        title={frozen ? 'Resume flow' : 'Pause flow'}
      >
        {frozen ? '▶ Play' : '⏸ Pause'}
      </button>

      {/* iOS sync */}
      <button
        onClick={onIosSync}
        className="text-[9px] font-mono transition-colors"
        style={{ color: iosSync ? '#00ff88' : '#334155' }}
        title={iosSync ? 'Mobile Sync Active' : 'Mobile Sync Off'}
      >
        iOS
      </button>

      {/* Detach */}
      <button
        onClick={onDetach}
        className="text-[9px] font-mono text-[#334155] hover:text-slate-500 transition-colors"
        title="Detach window"
      >
        ⎋
      </button>

      {/* Mute */}
      <button
        onClick={() => setMuted(v => !v)}
        className="text-[10px] transition-colors"
        style={{ color: muted ? '#1e3352' : '#334155' }}
        title={muted ? 'Unmute alerts' : 'Mute alerts'}
      >
        {muted ? '🔕' : '🔔'}
      </button>

      {/* Live clock */}
      <span className="text-[10px] font-mono tabular-nums text-slate-600 shrink-0">{clock}</span>
    </div>
  )
}
