import React, { useState, useRef, useEffect } from 'react'

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', 'D']
const QUICK_PICKS = ['3m', '10m', '30m', '4h', 'W', 'M']

const OVERLAYS = [
  { key: 'vwap',  label: 'VWAP',   color: '#38bdf8' },
  { key: 'ema20', label: 'EMA 20', color: '#00ff88' },
  { key: 'ema50', label: 'EMA 50', color: '#f59e0b' },
]

function loadSaved() {
  try { return JSON.parse(localStorage.getItem('td_custom_tfs') || '[]') } catch { return [] }
}

export default function ChartControls({ timeframe, onTimeframeChange, overlays, onToggle }) {
  const [popupOpen,    setPopupOpen]    = useState(false)
  const [customTf,     setCustomTf]     = useState('')
  const [inputNum,     setInputNum]     = useState('')
  const [inputUnit,    setInputUnit]    = useState('m')
  const [savedCustoms, setSavedCustoms] = useState(loadSaved)
  const popupRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('td_custom_tfs', JSON.stringify(savedCustoms))
  }, [savedCustoms])

  useEffect(() => {
    if (!popupOpen) return
    function handler(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) setPopupOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popupOpen])

  useEffect(() => {
    if (popupOpen) {
      setInputNum('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [popupOpen])

  function applyCustom(val) {
    const v = val.trim().toUpperCase()
    if (!v) return
    setCustomTf(v)
    onTimeframeChange(v)
    setPopupOpen(false)
  }

  function numericValue() {
    const n = Number(inputNum)
    if (!inputNum || isNaN(n) || n < 1) return null
    return `${inputNum}${inputUnit}`
  }

  function handleUse() {
    const v = numericValue()
    if (v) applyCustom(v)
  }

  function handleSave() {
    const v = numericValue()
    if (!v) return
    const upper = v.toUpperCase()
    if (!savedCustoms.includes(upper) && !QUICK_PICKS.map(q => q.toUpperCase()).includes(upper)) {
      setSavedCustoms(prev => [...prev, upper])
    }
    applyCustom(v)
  }

  function removeCustom(val) {
    setSavedCustoms(prev => prev.filter(x => x !== val))
  }

  const isCustomActive = customTf && timeframe === customTf

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e3352] bg-[#0c1119] shrink-0">

      {/* Timeframe buttons */}
      <div className="flex gap-1 items-center">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
            style={
              timeframe === tf
                ? { borderColor: '#38bdf8', color: '#38bdf8', boxShadow: '0 0 0 1px #38bdf8' }
                : { borderColor: '#1e3352', color: '#475569' }
            }
          >
            {tf}
          </button>
        ))}

        {/* Custom interval button */}
        <div className="relative" ref={popupRef}>
          <button
            onClick={() => setPopupOpen(o => !o)}
            title="Custom interval"
            className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
            style={
              isCustomActive
                ? { borderColor: '#a855f7', color: '#a855f7', boxShadow: '0 0 0 1px #a855f7' }
                : { borderColor: '#1e3352', color: '#475569' }
            }
          >
            {isCustomActive ? customTf : '···'}
          </button>

          {popupOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-50 bg-[#0c1119] border border-[#1e3352] p-2 flex flex-col gap-2"
              style={{ minWidth: 160 }}
            >
              <span className="text-[8px] text-[#475569] font-mono uppercase tracking-wider">Quick Select</span>

              {/* Default quick picks */}
              <div className="flex flex-wrap gap-1">
                {QUICK_PICKS.map(qp => (
                  <button
                    key={qp}
                    onClick={() => applyCustom(qp)}
                    className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
                    style={
                      customTf === qp.toUpperCase()
                        ? { borderColor: '#a855f7', color: '#a855f7', boxShadow: '0 0 0 1px #a855f7' }
                        : { borderColor: '#1e3352', color: '#94a3b8' }
                    }
                  >
                    {qp}
                  </button>
                ))}

                {/* Saved custom picks */}
                {savedCustoms.map(c => (
                  <div
                    key={c}
                    className="flex items-stretch border transition-all duration-100"
                    style={
                      customTf === c
                        ? { borderColor: '#a855f7', boxShadow: '0 0 0 1px #a855f7' }
                        : { borderColor: '#334155' }
                    }
                  >
                    <button
                      onClick={() => applyCustom(c)}
                      className="px-1.5 py-0.5 text-[9px] font-mono"
                      style={{ color: customTf === c ? '#a855f7' : '#94a3b8' }}
                    >
                      {c}
                    </button>
                    <button
                      onClick={() => removeCustom(c)}
                      className="px-1 text-[9px] border-l border-[#1e3352] text-slate-600 hover:text-[#ff0055] transition-colors leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#1e3352] pt-2 flex flex-col gap-1.5">
                <span className="text-[8px] text-[#475569] font-mono uppercase tracking-wider">Custom</span>

                {/* Number + unit selector */}
                <div className="flex gap-1">
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    value={inputNum}
                    onChange={e => setInputNum(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUse() }}
                    placeholder="1"
                    className="w-10 bg-[#0d1a2d] border border-[#1e3352] text-[9px] font-mono text-[#e2e8f0] px-1.5 py-0.5 outline-none placeholder-[#334155] focus:border-[#a855f7]"
                  />
                  <select
                    value={inputUnit}
                    onChange={e => setInputUnit(e.target.value)}
                    className="flex-1 bg-[#0d1a2d] border border-[#1e3352] text-[9px] font-mono text-[#e2e8f0] px-1 py-0.5 outline-none focus:border-[#a855f7] cursor-pointer"
                  >
                    <option value="m">min</option>
                    <option value="h">hr</option>
                  </select>
                </div>

                {/* USE / SAVE buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={handleUse}
                    className="flex-1 py-0.5 text-[9px] font-mono border border-[#1e3352] text-[#94a3b8] transition-all duration-100 hover:border-[#a855f7] hover:text-[#a855f7]"
                  >
                    USE
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-0.5 text-[9px] font-mono border border-[#a855f7] text-[#a855f7] transition-all duration-100 hover:bg-[#a855f7]/10"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay toggles */}
      <div className="flex gap-1">
        {OVERLAYS.map(({ key, label, color }) => {
          const on = overlays?.[key]
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="px-1.5 py-0.5 text-[9px] font-mono border transition-all duration-100"
              style={
                on
                  ? { borderColor: color, color, boxShadow: `0 0 0 1px ${color}` }
                  : { borderColor: '#1e3352', color: '#475569' }
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
