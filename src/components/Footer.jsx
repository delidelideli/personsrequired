import React from 'react'

export default function Footer({ frozen, onFreeze, onDetach, iosSync, onIosSync, muted, onMute, onSettings }) {

  return (
    <div className="flex items-center gap-2 px-3 h-8 border-t border-[#1e3352] bg-[#0c1119] shrink-0">

      <span className="text-[10px] text-slate-700">◈</span>
      <span className="text-[9px] font-mono text-slate-700 truncate flex-1 min-w-0">
        Apex: NVDA LONG — Entry $924 | Target $940
      </span>

      {/* Freeze toggle */}
      <button
        onClick={onFreeze}
        className="text-[9px] font-mono px-2 py-0.5 border transition-all duration-100"
        style={
          frozen
            ? { borderColor: '#38bdf8', color: '#38bdf8', boxShadow: '0 0 0 1px #38bdf8' }
            : { borderColor: '#1e3352', color: '#475569' }
        }
        title={frozen ? 'Unfreeze flow' : 'Freeze flow'}
      >
        {frozen ? '⏸' : '▶'}
      </button>

      {/* iOS sync */}
      <button
        onClick={onIosSync}
        className="text-[9px] font-mono px-2 py-0.5 border transition-all duration-100"
        style={
          iosSync
            ? { borderColor: '#00ff88', color: '#00ff88', boxShadow: '0 0 0 1px #00ff88' }
            : { borderColor: '#1e3352', color: '#475569' }
        }
      >
        iOS
      </button>

      {/* Detach */}
      <button
        onClick={onDetach}
        className="text-[9px] font-mono px-2 py-0.5 border border-[#1e3352] text-slate-600 hover:border-[#38bdf8] hover:text-[#38bdf8] transition-colors"
      >
        ⎋ DETACH
      </button>

      {/* Mute */}
      <button
        onClick={onMute}
        className="text-[10px] transition-colors"
        style={{ color: muted ? '#1e3352' : '#475569' }}
        title={muted ? 'Unmute alerts' : 'Mute alerts'}
      >
        {muted ? '🔕' : '🔔'}
      </button>

      <button
        onClick={onSettings}
        className="text-[14px] transition-colors hover:text-slate-300"
        style={{ color: '#475569' }}
        title="Settings"
      >⚙</button>
    </div>
  )
}
