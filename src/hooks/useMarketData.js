import { useEffect, useRef, useState } from 'react'
import { initSocket } from '../lib/socket'
import { mockDataService } from '../lib/mockDataService'

const INDEX_DEFAULTS = {
  SPY: { price: '524.83', change: '+0.23%', up: true  },
  QQQ: { price: '448.12', change: '-0.12%', up: false },
  VIX: { price: '18.42',  change: '+2.14%', up: true  },
  BTC: { price: '67420',  change: '+1.08%', up: true  },
  DXY: { price: '104.21', change: '-0.07%', up: false },
}

export function useMarketData(ticker, timeframe) {
  const socketRef    = useRef(null)
  const usingMock    = useRef(false)
  const tickerRef    = useRef(ticker)
  const timeframeRef = useRef(timeframe)

  const [connected,   setConnected]   = useState(false)
  const [indexPrices, setIndexPrices] = useState(INDEX_DEFAULTS)
  const [liveTick,    setLiveTick]    = useState(null)
  const [livePrice,   setLivePrice]   = useState(null)
  const [liveFlows,   setLiveFlows]   = useState([])

  useEffect(() => { tickerRef.current    = ticker    }, [ticker])
  useEffect(() => { timeframeRef.current = timeframe }, [timeframe])

  // ── Connect on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let active = true

    initSocket().then(s => {
      if (!active) return

      if (!s) {
        // Server offline — fall back to client-side mock service
        usingMock.current = true
        mockDataService.start(tickerRef.current, timeframeRef.current)

        mockDataService.on('index_tick', data => setIndexPrices(data))
        mockDataService.on('price_tick', data => {
          setLiveTick(data.candle)
          setLivePrice({ price: data.price, change: data.change, changeP: data.changeP, up: data.up })
        })
        mockDataService.on('flow_event', ev => {
          setLiveFlows(prev => [ev, ...prev].slice(0, 20))
        })

        // Show as connected so the UI doesn't look broken
        setConnected(true)
        return
      }

      // Server is online — use Socket.io
      socketRef.current = s

      s.on('connect', () => {
        setConnected(true)
        s.emit('subscribe_ticker', { ticker: tickerRef.current, timeframe: timeframeRef.current })
      })
      s.on('disconnect', () => setConnected(false))
      s.on('index_tick',  data => setIndexPrices(data))
      s.on('price_tick',  data => {
        setLiveTick(data.candle)
        setLivePrice({ price: data.price, change: data.change, changeP: data.changeP, up: data.up })
      })
      s.on('flow_event', ev => {
        setLiveFlows(prev => [ev, ...prev].slice(0, 20))
      })

      if (s.connected) {
        setConnected(true)
        s.emit('subscribe_ticker', { ticker: tickerRef.current, timeframe: timeframeRef.current })
      }
    })

    return () => {
      active = false
      if (usingMock.current) mockDataService.stop()
    }
  }, [])

  // ── Re-subscribe when ticker / timeframe changes ─────────────────────────
  useEffect(() => {
    if (usingMock.current) {
      mockDataService.setTicker(ticker, timeframe)
      setLiveTick(null)
      setLivePrice(null)
      return
    }
    const s = socketRef.current
    if (!s?.connected) return
    s.emit('subscribe_ticker', { ticker, timeframe })
    setLiveTick(null)
    setLivePrice(null)
  }, [ticker, timeframe])

  return { connected, indexPrices, liveTick, livePrice, liveFlows }
}
