import React, { useState, useEffect } from 'react'
import StatusBar     from './components/StatusBar'
import TickerHeader  from './components/TickerHeader'
import ChartPanel    from './components/ChartPanel'
import ChartControls from './components/ChartControls'
import Watchlist     from './components/Watchlist'
import MarketInternals from './components/MarketInternals'
import RightSidebar  from './components/RightSidebar'
import Footer        from './components/Footer'
import DetachModal   from './components/DetachModal'
import Toast         from './components/Toast'
import { useMarketData } from './hooks/useMarketData'
import { save, loadAll, onChange } from './lib/storage'

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_WATCHLIST = ['NVDA', 'TSLA', 'META', 'AAPL', 'SPY', 'AMD']
const DEFAULT_OVERLAYS  = {
  vwap: true, ema20: true, ema50: false, ema200: false,
  pdh:  true, pdl:  true,  pmh:  false,  pml:   false,
}

export default function App() {
  // ── Core UI state ───────────────────────────────────────────────────────
  const [ticker,     setTickerState]  = useState('NVDA')
  const [timeframe,  setTimeframe]    = useState('5m')
  const [overlays,   setOverlays]     = useState(DEFAULT_OVERLAYS)
  const [watchlist,  setWatchlist]    = useState(DEFAULT_WATCHLIST)
  const [iosSync,    setIosSync]      = useState(false)
  const [frozen,     setFrozen]       = useState(false)
  const [showDetach, setShowDetach]   = useState(false)
  const [toast,      setToast]        = useState(null)

  // ── Load persisted state on mount ───────────────────────────────────────
  useEffect(() => {
    loadAll(['td_ticker', 'td_timeframe', 'td_overlays', 'td_watchlist', 'td_ios_sync'])
      .then(stored => {
        if (stored.td_ticker)                 setTickerState(stored.td_ticker)
        if (stored.td_timeframe)              setTimeframe(stored.td_timeframe)
        if (stored.td_overlays)               setOverlays(o => ({ ...o, ...stored.td_overlays }))
        if (Array.isArray(stored.td_watchlist)) setWatchlist(stored.td_watchlist)
        if (stored.td_ios_sync != null)       setIosSync(stored.td_ios_sync)
      })

    // Cross-window sync — fires when any other window writes to storage
    const cleanup = onChange(updates => {
      if ('td_ticker'    in updates) setTickerState(updates.td_ticker)
      if ('td_timeframe' in updates) setTimeframe(updates.td_timeframe)
      if ('td_overlays'  in updates) setOverlays(o => ({ ...o, ...updates.td_overlays }))
      if ('td_watchlist' in updates && Array.isArray(updates.td_watchlist))
        setWatchlist(updates.td_watchlist)
      if ('td_ios_sync'  in updates) setIosSync(updates.td_ios_sync)
    })

    return cleanup
  }, [])

  // ── Persist every state change ───────────────────────────────────────────
  useEffect(() => { save('td_ticker',    ticker)    }, [ticker])
  useEffect(() => { save('td_timeframe', timeframe)  }, [timeframe])
  useEffect(() => { save('td_overlays',  overlays)   }, [overlays])
  useEffect(() => { save('td_watchlist', watchlist)  }, [watchlist])
  useEffect(() => { save('td_ios_sync',  iosSync)    }, [iosSync])

  // ── Actions ──────────────────────────────────────────────────────────────
  function setTicker(sym) {
    setTickerState(sym)
  }

  function toggleOverlay(key) {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function addToWatchlist(symbol) {
    setWatchlist(prev => prev.includes(symbol) ? prev : [...prev, symbol])
  }

  function handleSearch(symbol) {
    addToWatchlist(symbol)
    setTicker(symbol)
  }

  function handleIosSync() {
    const next = !iosSync
    setIosSync(next)
    setToast(next ? 'Mobile Sync Active' : 'Mobile Sync Off')
  }

  // ── Detach ───────────────────────────────────────────────────────────────
  function handleDetach() {
    const url = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
      ? chrome.runtime.getURL('sidepanel.html') + '?detached=1'
      : window.location.href + '?detached=1'

    if (typeof chrome !== 'undefined' && chrome.windows?.create) {
      chrome.windows.create({ url, type: 'popup', width: 1280, height: 900, focused: true })
    } else {
      window.open(url, '_blank', 'popup,width=1280,height=900')
    }
    setShowDetach(false)
  }

  // ── Live market data ─────────────────────────────────────────────────────
  const { connected, indexPrices, liveTick, livePrice, liveFlows } = useMarketData(ticker, timeframe)

  return (
    <div className="flex flex-col h-screen w-full bg-[#0c1119] text-slate-300 overflow-hidden select-none">

      <StatusBar indexPrices={indexPrices} connected={connected} activeTicker={ticker} />
      <TickerHeader ticker={ticker} livePrice={livePrice} onSearch={handleSearch} />

      <ChartPanel
        ticker={ticker}
        timeframe={timeframe}
        overlays={overlays}
        frozen={frozen}
        liveTick={liveTick}
        wrapClass="h-[280px] shrink-0"
      />
      <ChartControls
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        overlays={overlays}
        onToggle={toggleOverlay}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-col w-40 border-r border-[#1e3352] shrink-0 overflow-y-auto">
          <Watchlist
            tickers={watchlist}
            activeTicker={ticker}
            onSelect={setTicker}
            onAdd={addToWatchlist}
            livePrice={livePrice}
          />
        </div>

        <div className="flex flex-col w-40 border-r border-[#1e3352] shrink-0 overflow-hidden">
          <MarketInternals />
        </div>

        <div className="flex-1 overflow-hidden min-w-0">
          <RightSidebar ticker={ticker} />
        </div>
      </div>

      <Footer
        frozen={frozen}
        onFreeze={() => setFrozen(v => !v)}
        onDetach={() => setShowDetach(true)}
        iosSync={iosSync}
        onIosSync={handleIosSync}
      />

      {showDetach && (
        <DetachModal ticker={ticker} onConfirm={handleDetach} onClose={() => setShowDetach(false)} />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  )
}
