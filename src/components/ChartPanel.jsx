import React, { useEffect, useRef, useState } from 'react'
import { createChart, LineStyle, CrosshairMode } from 'lightweight-charts'
import { generateCandles, calcEMA, calcVWAP, calcLevels } from '../lib/chartData'
import { tfIsDaily } from '../lib/timeframeUtils'
import { SERVER_URL } from '../lib/config'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(v) { return v?.toFixed(2) ?? '—' }
function fmtVol(v) {
  if (!v) return '—'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K'
  return String(v)
}
function fmtTime(time, timeframe) {
  if (!time) return ''
  if (typeof time === 'object') {
    // Business day object {year, month, day}
    return `${time.month}/${time.day}/${time.year}`
  }
  const d = new Date(time * 1000)
  if (tfIsDaily(timeframe)) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Tooltip bar ────────────────────────────────────────────────────────────
function Tooltip({ data, timeframe }) {
  if (!data) return null
  const color = data.up ? '#00ff88' : '#ff0055'
  return (
    <div className="absolute top-2 left-2 z-20 pointer-events-none flex items-center gap-3 px-3 py-1.5 panel">
      <span className="td-label mr-1">{fmtTime(data.time, timeframe)}</span>
      {[['O', data.open], ['H', data.high], ['L', data.low], ['C', data.close]].map(([lbl, val]) => (
        <span key={lbl} className="flex items-center gap-1">
          <span className="td-label">{lbl}</span>
          <span className="num-sm" style={{ color }}>{fmtPrice(val)}</span>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="td-label">VOL</span>
        <span className="num-sm text-[#334155]">{fmtVol(data.volume)}</span>
      </span>
    </div>
  )
}

// ── Zoom indicator ─────────────────────────────────────────────────────────
function ZoomBadge({ text }) {
  if (!text) return null
  return (
    <div className="absolute bottom-10 right-3 z-20 pointer-events-none">
      <span className="num-xs text-[#334155] bg-[#0c1119] px-1.5 py-0.5 border border-[#1e3352]">
        {text}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ChartPanel({ ticker = 'NVDA', timeframe = '5m', overlays, frozen, liveTick, wrapClass }) {
  const wrapRef      = useRef(null)   // outer flex-1 div
  const containerRef = useRef(null)   // absolute-fill inner div — chart mounts here
  const chartRef     = useRef(null)
  const seriesRef    = useRef({})
  const linesRef     = useRef({})     // IPriceLine refs for PDH/PDL/PMH/PML
  const zoomTimer    = useRef(null)

  const [tooltip,  setTooltip]  = useState(null)
  const [zoomText, setZoomText] = useState(null)
  const [syncing,  setSyncing]  = useState(false)
  const prevTickerRef = useRef(ticker)

  // Brief "SYNCING…" overlay whenever the active ticker changes
  useEffect(() => {
    if (ticker === prevTickerRef.current) return
    prevTickerRef.current = ticker
    setSyncing(true)
    const t = setTimeout(() => setSyncing(false), 700)
    return () => clearTimeout(t)
  }, [ticker])

  // ── Mount: create chart and all series ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const chart = createChart(container, {
      width:  container.clientWidth,
      height: container.clientHeight,
      layout: {
        background:  { color: '#0c1119' },
        textColor:   '#334155',
        fontFamily:  '"JetBrains Mono", ui-monospace, monospace',
        fontSize:    10,
      },
      grid: {
        vertLines: { color: '#1e3352', style: LineStyle.Solid },
        horzLines: { color: '#1e3352', style: LineStyle.Solid },
      },
      crosshair: {
        mode:     CrosshairMode.Normal,
        vertLine: { color: '#38bdf8', labelBackgroundColor: '#0c1119', width: 1 },
        horzLine: { color: '#38bdf8', labelBackgroundColor: '#0c1119', width: 1 },
      },
      rightPriceScale: {
        borderColor: '#1e3352',
      },
      timeScale: {
        borderColor:     '#1e3352',
        timeVisible:     true,
        secondsVisible:  false,
      },
      watermark: {
        visible:    true,
        fontSize:   52,
        horzAlign:  'center',
        vertAlign:  'center',
        color:      'rgba(255,255,255,0.025)',
        text:       `${ticker} – ${timeframe}`,
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontStyle:  'bold',
      },
      handleScroll:   { mouseWheel: true, pressedMouseMove: true },
      handleScale:    { mouseWheel: true, pinch: true },
    })

    chartRef.current = chart

    // ── Candlestick ────────────────────────────────────────────────────
    const candleSeries = chart.addCandlestickSeries({
      upColor:         '#00ff88',
      downColor:       '#ff0055',
      borderUpColor:   '#00ff88',
      borderDownColor: '#ff0055',
      wickUpColor:     '#00ff88',
      wickDownColor:   '#ff0055',
    })

    // ── Volume histogram (separate scale, bottom ~20%) ─────────────────
    const volSeries = chart.addHistogramSeries({
      priceFormat:  { type: 'volume' },
      priceScaleId: 'vol',
    })

    // Configure scales after series are added
    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.20 },
    })
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
      visible:      false,
    })

    // ── Overlay line series ────────────────────────────────────────────
    const shared = { priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }

    const vwapSeries = chart.addLineSeries({
      ...shared, color: '#38bdf8', lineWidth: 1, lineStyle: LineStyle.Dashed,
    })
    const ema20Series = chart.addLineSeries({
      ...shared, color: '#00ff88', lineWidth: 1,
    })
    const ema50Series = chart.addLineSeries({
      ...shared, color: '#f59e0b', lineWidth: 1,
    })
    const ema200Series = chart.addLineSeries({
      ...shared, color: '#a855f7', lineWidth: 1,
    })

    seriesRef.current = { candleSeries, volSeries, vwapSeries, ema20Series, ema50Series, ema200Series }

    // ── Crosshair → tooltip ────────────────────────────────────────────
    chart.subscribeCrosshairMove(param => {
      if (!param?.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        setTooltip(null)
        return
      }
      const c = param.seriesData.get(candleSeries)
      const v = param.seriesData.get(volSeries)
      if (!c) { setTooltip(null); return }
      setTooltip({
        time:   param.time,
        open:   c.open,
        high:   c.high,
        low:    c.low,
        close:  c.close,
        volume: v?.value ?? 0,
        up:     c.close >= c.open,
      })
    })

    // ── Visible range → zoom indicator ────────────────────────────────
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (!range) return
      const visible = Math.max(1, range.to - range.from)
      const zoom    = Math.min(5, Math.max(0.5, 200 / visible))
      setZoomText(`${zoom.toFixed(1)}x`)
      clearTimeout(zoomTimer.current)
      zoomTimer.current = setTimeout(() => setZoomText(null), 1400)
    })

    // ── ResizeObserver ─────────────────────────────────────────────────
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) chart.applyOptions({ width, height })
    })
    ro.observe(container)

    return () => {
      clearTimeout(zoomTimer.current)
      ro.disconnect()
      chart.remove()
    }
  }, []) // mount only

  // ── Load / reload data when ticker or timeframe changes ─────────────────
  useEffect(() => {
    const { candleSeries, volSeries, vwapSeries, ema20Series, ema50Series, ema200Series } = seriesRef.current
    if (!candleSeries) return

    const controller = new AbortController()

    async function load() {
      let candles
      try {
        const res = await fetch(
          `${SERVER_URL}/history?ticker=${encodeURIComponent(ticker)}&timeframe=${encodeURIComponent(timeframe)}`,
          { signal: controller.signal },
        )
        candles = res.ok ? await res.json() : generateCandles(ticker, timeframe)
      } catch {
        // Server offline or request aborted — fall back to local generation
        candles = generateCandles(ticker, timeframe)
      }

      if (controller.signal.aborted) return

      const volData = candles.map(c => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(0,255,136,0.22)' : 'rgba(255,0,85,0.22)',
      }))
      const levels = calcLevels(candles)

      candleSeries.setData(candles)
      volSeries.setData(volData)
      vwapSeries.setData(calcVWAP(candles))
      ema20Series.setData(calcEMA(candles, 20))
      ema50Series.setData(calcEMA(candles, 50))
      ema200Series.setData(calcEMA(candles, 200))

      const prev = linesRef.current
      if (prev.pdh) candleSeries.removePriceLine(prev.pdh)
      if (prev.pdl) candleSeries.removePriceLine(prev.pdl)
      if (prev.pmh) candleSeries.removePriceLine(prev.pmh)
      if (prev.pml) candleSeries.removePriceLine(prev.pml)

      linesRef.current = {
        pdh: candleSeries.createPriceLine({ price: levels.pdh, color: '#ff0055', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'PDH' }),
        pdl: candleSeries.createPriceLine({ price: levels.pdl, color: '#38bdf8', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: 'PDL' }),
        pmh: candleSeries.createPriceLine({ price: levels.pmh, color: '#ff0055', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: 'PMH' }),
        pml: candleSeries.createPriceLine({ price: levels.pml, color: '#38bdf8', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: 'PML' }),
      }

      chartRef.current?.applyOptions({ watermark: { text: `${ticker} – ${timeframe}` } })
      chartRef.current?.timeScale().applyOptions({ timeVisible: !tfIsDaily(timeframe) })
      chartRef.current?.timeScale().fitContent()
    }

    load()
    return () => controller.abort()
  }, [ticker, timeframe])

  // ── Live tick: update current candle from socket stream ─────────────────
  useEffect(() => {
    if (!liveTick || frozen) return
    const { candleSeries, volSeries } = seriesRef.current
    if (!candleSeries || !volSeries) return
    try {
      candleSeries.update(liveTick)
      volSeries.update({
        time:  liveTick.time,
        value: liveTick.volume,
        color: liveTick.close >= liveTick.open ? 'rgba(0,255,136,0.25)' : 'rgba(255,0,85,0.25)',
      })
    } catch {
      // Lightweight Charts throws if a tick's time is ≤ last candle — safe to ignore
    }
  }, [liveTick, frozen])

  // ── Sync overlay visibility ──────────────────────────────────────────────
  useEffect(() => {
    const { vwapSeries, ema20Series, ema50Series, ema200Series } = seriesRef.current
    if (!vwapSeries) return

    vwapSeries.applyOptions({ visible: overlays.vwap })
    ema20Series.applyOptions({ visible: overlays.ema20 })
    ema50Series.applyOptions({ visible: overlays.ema50 })
    ema200Series.applyOptions({ visible: overlays.ema200 })

    // Price lines toggled via color — hide by matching background color
    const hide = 'rgba(0,0,0,0)'
    const pl   = linesRef.current
    if (pl.pdh) pl.pdh.applyOptions({ color: overlays.pdh ? '#ff0055' : hide, axisLabelVisible: !!overlays.pdh })
    if (pl.pdl) pl.pdl.applyOptions({ color: overlays.pdl ? '#38bdf8' : hide, axisLabelVisible: !!overlays.pdl })
    if (pl.pmh) pl.pmh.applyOptions({ color: overlays.pmh ? '#ff0055' : hide, axisLabelVisible: !!overlays.pmh })
    if (pl.pml) pl.pml.applyOptions({ color: overlays.pml ? '#38bdf8' : hide, axisLabelVisible: !!overlays.pml })
  }, [overlays])

  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-[#0c1119] ${wrapClass ?? 'flex-1 min-h-0'}`}>
      {/* LWC mounts into this absolutely-filled div */}
      <div ref={containerRef} className="absolute inset-0" />

      <Tooltip data={tooltip} timeframe={timeframe} />
      <ZoomBadge text={zoomText} />

      {frozen && (
        <div className="absolute inset-0 z-10 pointer-events-none freeze-stripe">
          <div className="absolute top-2 right-2 flex items-center gap-1.5 num-xs text-[#38bdf8] bg-[#0c1119]/80 px-2 py-1 border border-[#1e3352]">
            ⏸ HISTORICAL MODE
          </div>
        </div>
      )}

      {syncing && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-[#0c1119]/60">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#1e3352] bg-[#0c1119] num-xs text-[#38bdf8]">
            <span className="animate-pulse">◈</span> SYNCING…
          </div>
        </div>
      )}
    </div>
  )
}
