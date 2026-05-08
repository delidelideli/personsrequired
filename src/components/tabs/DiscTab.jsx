import React, { useState } from 'react'

const CHANNELS = ['#alerts', '#signals', '#general']

const MESSAGES = [
  {
    user: 'Apex',
    avatar: 'A',
    time: '9:28 AM',
    isTradeCard: true,
    ticker: 'NVDA LONG',
    trade: { Entry: '$924', Target: '$940 / $955', Trim: '$932', Stop: '$915' },
  },
  {
    user: 'FluxTrade',
    avatar: 'F',
    time: '9:31 AM',
    isTradeCard: false,
    content: 'Heavy call sweep on QQQ 450C, notable.',
  },
  {
    user: 'Apex',
    avatar: 'A',
    time: '9:33 AM',
    isTradeCard: false,
    content: 'VWAP hold on NVDA. Looking for 930 break.',
  },
]

export default function DiscTab() {
  const [channel, setChannel] = useState('#alerts')
  const [input, setInput] = useState('')

  function handleSend(e) {
    if (e.key === 'Enter' && input.trim()) setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e3352] shrink-0">
        <span className="text-[10px] font-mono text-slate-400">TradersHub</span>
        <span className="flex items-center gap-1 text-[9px] font-mono text-[#00ff88]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block" />
          LIVE
        </span>
      </div>

      <div className="flex shrink-0 border-b border-[#1e3352]">
        {CHANNELS.map(ch => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className="flex-1 py-1 text-[9px] font-mono border-r border-[#1e3352] last:border-r-0 transition-colors"
            style={channel === ch ? { color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.07)' } : { color: '#475569' }}
          >
            {ch}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2.5 min-h-0">
        {MESSAGES.map((message, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1e3352] flex items-center justify-center text-[9px] font-mono text-slate-500 shrink-0">
              {message.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-[#38bdf8]">{message.user}</span>
                <span className="text-[9px] font-mono text-slate-800">{message.time}</span>
              </div>

              {message.isTradeCard ? (
                <div className="border border-[#00ff88]/20 bg-[#00ff88]/5 p-2">
                  <div className="text-[9px] font-mono font-semibold text-[#00ff88] mb-1.5">{message.ticker}</div>
                  {Object.entries(message.trade).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-700">{k}</span>
                      <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-slate-500">{message.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#1e3352] p-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleSend}
          placeholder={`Message ${channel}`}
          className="w-full bg-transparent border border-[#1e3352] px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-[#38bdf8] placeholder:text-slate-800 transition-colors"
        />
      </div>
    </div>
  )
}
