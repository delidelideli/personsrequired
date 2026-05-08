import React from 'react'

export default function DetachModal({ ticker, onConfirm, onClose }) {
  const isMarketOpen = (() => {
    const now = new Date()
    const day = now.getDay()
    if (day === 0 || day === 6) return false
    const mins = now.getHours() * 60 + now.getMinutes()
    return mins >= 9 * 60 + 30 && mins < 16 * 60
  })()

  const snapshot = [
    ['Active ticker', ticker ?? 'NVDA'],
    ['Market',        isMarketOpen ? 'OPEN' : 'CLOSED'],
    ['Window type',   'Standalone popup'],
    ['Size',          '1280 × 900'],
  ]

  return (
    <div className="absolute inset-0 bg-[#0c1119]/85 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-64 border border-[#1e3352] bg-[#0c1119]">

        <div className="px-4 py-3 border-b border-[#1e3352]">
          <div className="num-md text-slate-200 tracking-widest">DETACH WINDOW</div>
          <div className="td-label mt-0.5">Opens in standalone popup</div>
        </div>

        <div className="p-4 space-y-2.5">
          {snapshot.map(([key, val]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="td-label">{key}</span>
              <span className="num-sm text-slate-300">{val}</span>
            </div>
          ))}
        </div>

        <div className="flex border-t border-[#1e3352]">
          <button
            onClick={onClose}
            className="flex-1 py-2 hw-switch border-r border-[#1e3352] justify-center"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 hw-switch hw-on-blue justify-center"
          >
            OPEN WINDOW
          </button>
        </div>

      </div>
    </div>
  )
}
