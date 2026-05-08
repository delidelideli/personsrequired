import React, { useState, useEffect } from 'react'

const THESIS_POOL = {
  NVDA: [
    { bias: 'BULLISH', color: '#00ff88',
      thesis: 'NVDA holds VWAP with heavy call sweep at the $930 strike. Technical posture favors continuation above $920 into earnings next week.',
      tags: ['VWAP HOLD', 'CALL SWEEP', 'EARNINGS'] },
    { bias: 'BULLISH', color: '#00ff88',
      thesis: 'NVDA breaking above $935 on elevated volume. Dark pool block at $940 signals institutional accumulation — momentum favors bulls.',
      tags: ['BREAKOUT', 'DARK POOL', 'MOMENTUM'] },
  ],
  TSLA: [
    { bias: 'BEARISH', color: '#ff0055',
      thesis: 'TSLA rejected PDH with elevated put volume. Risk-off sentiment below $250 with order flow skewed to downside protection.',
      tags: ['PDH REJECT', 'PUT FLOW', 'RISK-OFF'] },
    { bias: 'BEARISH', color: '#ff0055',
      thesis: 'TSLA failing VWAP reclaim. Persistent put sweeps in the $240–245 range suggest institutional hedging into the week.',
      tags: ['VWAP FAIL', 'PUT SWEEP', 'HEDGE'] },
  ],
  META: [
    { bias: 'NEUTRAL', color: '#f59e0b',
      thesis: 'META consolidating below $515. Balanced order flow — wait for directional confirmation before entering.',
      tags: ['CONSOLIDATION', 'BALANCED FLOW'] },
    { bias: 'NEUTRAL', color: '#f59e0b',
      thesis: 'META coiling at $512 with declining volume. Neither bulls nor bears committed — breakout setup developing on 1h timeframe.',
      tags: ['COIL', 'LOW VOLUME', 'WATCH'] },
  ],
  SPY: [
    { bias: 'BULLISH', color: '#00ff88',
      thesis: 'SPY breadth expanding with macro tailwinds. Key level $525 transitions to support on a clean close above.',
      tags: ['BREADTH', 'MACRO', 'SUPPORT'] },
    { bias: 'BULLISH', color: '#00ff88',
      thesis: 'SPY reclaiming $525 with advancing issues outpacing decliners 3:1. Buy program flow confirms institutional participation.',
      tags: ['BREADTH', 'BUY PROGRAM', 'CONFIRMATION'] },
  ],
  AAPL: [
    { bias: 'NEUTRAL', color: '#f59e0b',
      thesis: 'AAPL range-bound between $188–192. Options activity centered at $190 straddle — directional players waiting for catalyst.',
      tags: ['RANGE', 'STRADDLE', 'NO EDGE'] },
    { bias: 'BULLISH', color: '#00ff88',
      thesis: 'AAPL breaking above $192 resistance on call sweep. Technical setup favors continuation toward $195.',
      tags: ['BREAKOUT', 'CALL SWEEP', 'CONTINUATION'] },
  ],
  AMD: [
    { bias: 'BULLISH', color: '#00ff88',
      thesis: 'AMD printing higher lows with NVDA sympathy move. $170 is key support; hold above it targets $180 by EOD.',
      tags: ['SYMPATHY', 'HIGHER LOWS', 'TARGET'] },
    { bias: 'BEARISH', color: '#ff0055',
      thesis: 'AMD underperforming NVDA on the sector rally. Relative weakness flagged — put sweep at $165 suggests downside hedge.',
      tags: ['REL WEAK', 'PUT SWEEP', 'HEDGE'] },
  ],
}

const FALLBACK = {
  bias: 'NEUTRAL', color: '#f59e0b',
  thesis: 'Insufficient order flow data for a high-conviction thesis. Monitor price action near key levels before entering.',
  tags: ['LOW DATA', 'WAIT'],
}

const BASE_TICKERS = ['NVDA', 'TSLA', 'META', 'SPY']

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getCompanions(activeTicker) {
  return BASE_TICKERS.filter(t => t !== activeTicker).slice(0, 3)
}

export default function AITab({ ticker = 'NVDA' }) {
  const [refreshCount, setRefreshCount] = useState(0)
  const [fading, setFading] = useState(false)
  const [timestamp, setTimestamp] = useState('9:25:14 AM')

  useEffect(() => {
    setRefreshCount(0)
  }, [ticker])

  function handleRefresh() {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setRefreshCount(c => c + 1)
      setTimestamp(formatTime(new Date()))
      setFading(false)
    }, 250)
  }

  const displayedTickers = [ticker, ...getCompanions(ticker)]

  return (
    <div>
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-[#1e3352]"
        style={{ backgroundColor: 'rgba(245,158,11,0.05)' }}
      >
        <div>
          <div className="text-[10px] font-mono font-semibold text-[#f59e0b]">9:25 AM THESIS</div>
          <div className="text-[9px] font-mono text-slate-700 mt-0.5">Generated {timestamp}</div>
        </div>
        <button
          onClick={handleRefresh}
          className="text-[9px] font-mono px-2 py-0.5 border border-[#1e3352] text-[#38bdf8] hover:border-[#38bdf8] transition-colors"
        >
          ↻ REFRESH
        </button>
      </div>

      {displayedTickers.map((t, idx) => {
        const pool = THESIS_POOL[t]
        const isActive = idx === 0
        const data = pool
          ? isActive
            ? pool[refreshCount % pool.length]
            : pool[0]
          : FALLBACK

        return (
          <div
            key={t}
            className="px-3 py-2.5 border-b border-[#1e3352]"
            style={isActive ? { backgroundColor: 'rgba(255,255,255,0.02)' } : {}}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono font-semibold text-slate-200">{t}</span>
              <span
                className="text-[8px] font-mono px-1.5 py-px font-semibold"
                style={{
                  color: data.color,
                  backgroundColor: data.color + '18',
                  border: `1px solid ${data.color}40`,
                }}
              >
                {data.bias}
              </span>
            </div>

            <p
              className="text-[9px] font-mono text-slate-600 leading-relaxed mb-1.5 transition-opacity duration-200"
              style={{ opacity: isActive && fading ? 0 : 1 }}
            >
              {data.thesis}
            </p>

            <div className="flex flex-wrap gap-1" style={{ opacity: isActive && fading ? 0 : 1 }}>
              {data.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[8px] font-mono px-1 py-px border border-[#1e3352] text-slate-700 transition-opacity duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
