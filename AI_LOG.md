# AI Development Log

A running record of everything done on this project, maintained by Claude.

---

## 2026-05-06

### Project Setup
- Initialized git repository in `C:\Users\conno\Downloads\personsrequired`
- Configured global git user: Connor / connortyde@gmail.com
- Enabled `core.longpaths` globally to avoid Windows path length errors
- Created starting project files:
  - `index.html` — basic HTML shell with title "Persons Required"
  - `style.css` — minimal reset styles
  - `main.js` — empty entry point
  - `.gitignore` — ignores `node_modules/`, `dist/`, `build/`, `.env`, `.zip`, `.crx`, `.DS_Store`, `.claude/`
- Connected remote to `https://github.com/delidelideli/personsrequired`
- Pulled existing remote content (LICENSE, README.md created on GitHub)
- Pushed initial commit to `main` branch
- Removed `.claude/settings.local.json` from git tracking and added `.claude/` to `.gitignore`

### Project Direction
- Phase 1: Build and test as a browser page, hosted via GitHub Pages
- Phase 2: Convert to a browser extension
- Phase 3: Possibly a mobile app

---

## 2026-05-07

### Project Pivot — TradeDesk Chrome Extension

Project direction changed. The product is now **TradeDesk** — a Manifest V3 Chrome extension for day traders. It is an "Intelligence Layer HUD": a browser sidebar companion that can detach into a standalone always-on-top window. It does not execute trades; it provides high-speed data, AI interpretation, and signal filtering.

Reference documents added to repo root:
- `features.txt` — full feature breakdown across all panels
- `guide.txt` — architecture, technical requirements, and commercialization notes
- `style guide.txt` — visual design constraints (Bloomberg Dark theme)

### Phase 1 — Visual Shell

Built the complete visual shell of the extension from scratch. No live data, no backend connections — static placeholder content only. Stack: **React 18 + Vite 5 + Tailwind CSS 3 + JetBrains Mono font**.

**Style rules enforced throughout:**
- Background `#0c1119` (Deep Slate), borders `1px solid #1e3352`, zero drop shadows
- `#00ff88` (Emerald) for bullish/up, `#ff0055` (Vivid Rose) for bearish/down
- `#38bdf8` blue accent, `#f59e0b` amber, `#a855f7` purple
- JetBrains Mono on all text, `tabular-nums` on all price figures
- Hardware switch toggles: `box-shadow: 0 0 0 1px <color>` when active
- Freeze overlay: diagonal CSS stripe via `repeating-linear-gradient(45deg, ...)`

**Files created:**

| File | Purpose |
|------|---------|
| `package.json` | React 18, Vite 5, Tailwind 3, autoprefixer, postcss |
| `vite.config.js` | Single entry point (`sidepanel.html`), predictable output filenames |
| `tailwind.config.js` | Custom color palette and JetBrains Mono font family |
| `postcss.config.js` | Tailwind + autoprefixer pipeline |
| `sidepanel.html` | Vite entry HTML, loads JetBrains Mono from Google Fonts |
| `public/manifest.json` | MV3 manifest — sidePanel permission, background service worker |
| `public/background.js` | Service worker stub — sets `openPanelOnActionClick: true` |
| `src/main.jsx` | React DOM root mount |
| `src/index.css` | Tailwind directives, global reset, scrollbar styling, freeze-stripe utility |
| `src/App.jsx` | Root layout: StatusBar → TickerHeader → [Left \| Chart \| Right] → Footer |
| `src/components/StatusBar.jsx` | Top bar: SPY/QQQ/VIX/BTC/DXY tickers + TradingView shortcut button |
| `src/components/TickerHeader.jsx` | Ticker search input, exchange badge, live price, change arrow, market status pill |
| `src/components/ChartPanel.jsx` | Chart area: grid, overlay lines (VWAP/EMA20/EMA50/EMA200/PDH/PDL), volume bars, freeze overlay |
| `src/components/TimeframeTray.jsx` | 1m/5m/15m/1h/4h/D/W buttons, PAUSE toggle, overlay settings gear |
| `src/components/OverlaySettings.jsx` | Expandable panel: Averages / Levels / Extras toggle pills (hardware switch style) |
| `src/components/Watchlist.jsx` | 6-ticker list (NVDA/TSLA/META/AAPL/SPY/AMD), strength bars, active highlight, add button |
| `src/components/FlowPanel.jsx` | Smart money filter ($50k+/$100k+/$500k+), 5 flow rows with color-coded left borders |
| `src/components/RightSidebar.jsx` | 4-tab container: FLOW / ECON / DISC / AI |
| `src/components/tabs/FlowTab.jsx` | 5 signal cards: Call Sweep, Dark Pool, Vol Spike, Short Interest, L2 Pressure |
| `src/components/tabs/EconTab.jsx` | 8 economic events with time, impact badge (HIGH/MED/LOW), prev/forecast/actual values |
| `src/components/tabs/DiscTab.jsx` | Discord-style chat: channel tabs, trade card parser, message feed, send input |
| `src/components/tabs/AITab.jsx` | 4 AI thesis cards with bias badge (BULLISH/BEARISH/NEUTRAL), thesis text, signal tags |
| `src/components/Footer.jsx` | Discord signal strip, iOS sync toggle, DETACH button, bell mute, settings placeholder |
| `src/components/DetachModal.jsx` | Session snapshot modal: ticker/timeframe/overlays/flow filter/freeze/sync + Open/Cancel |

**Build result:** `npm run build` — 45 modules, 0 errors, outputs to `dist/` in ~983ms.

### Environment Notes
- Node.js v24.15.0, npm 11.12.1 installed during this session
- Dev browser: **Opera GX** — `chrome.sidePanel` API not supported in Opera GX
- Extension accessed during development via `chrome-extension://<ID>/sidepanel.html` opened as a tab
- `chrome.windows.create` (detach window) works fine in Opera GX — relevant for a later phase
- Layout target: ~960px+ width (full detached window), 3-column layout. Sidebar responsiveness deferred.

---

## 2026-05-08

### Phase 2 — AI Thesis + Order Flow Logic

Built out the AI Thesis section, Order Flow filtering, and freeze overlay logic for the flow panel.

#### AITab — Dynamic thesis with refresh animation

**File changed:** `src/components/tabs/AITab.jsx`

- Accepts `ticker` prop; resets refresh state when ticker changes via `useEffect`
- Per-ticker thesis data defined in `THESIS_POOL` covering: NVDA, TSLA, META, AAPL, SPY, AMD + generic fallback
- Each ticker has 2 thesis variants — the REFRESH button cycles through them (active card only)
- 4 displayed cards: active ticker always first, companions pulled from [NVDA, TSLA, META, SPY] minus active
- Refresh flow: 250ms opacity-0 fade → update `refreshCount` + live timestamp → fade back in
- Bias badges: solid BULLISH (#00ff88) / BEARISH (#ff0055) / NEUTRAL (#f59e0b) with color fill + border

#### FlowTab — Per-ticker signal cards

**File changed:** `src/components/tabs/FlowTab.jsx`

- Accepts `ticker` prop
- `SIGNAL_DATA` map provides 5 signal cards per ticker for: NVDA, TSLA, META, AAPL, SPY, AMD
- Falls back to `—` placeholder rows for unknown tickers
- Cards update immediately when watchlist selection changes

#### FlowPanel — Filter logic + freeze overlay

**File changed:** `src/components/FlowPanel.jsx`

- Filter logic implemented: size values stored as numeric `sizeVal` alongside display string
- Thresholds: `$50k+` = 50,000 / `$100k+` = 100,000 / `$500k+` = 500,000
- Rows are filtered live; "No flow above X" empty state shown when all rows are hidden
- Accepts `frozen` prop — when true, renders `freeze-stripe` overlay (diagonal CSS glass from index.css) with ⏸ FROZEN badge in bottom-right corner, matching ChartPanel's historical-mode visual language

#### Prop threading

| File | Change |
|------|--------|
| `src/App.jsx` | Passes `frozen` to `FlowPanel`, passes `ticker` to `RightSidebar` |
| `src/components/RightSidebar.jsx` | Accepts `ticker` prop, threads it to `FlowTab` and `AITab` |

**Build result:** `npm run build` — 52 modules, 0 errors, 339 KB JS (107 KB gzip).

---

## 2026-05-08 (session 2)

### Backend Proxy Architecture — Demo Mode

Built the full Node.js backend proxy and wired live data into the frontend. No real API keys required — everything streams simulated data.

#### Server (`server/`)

| File | Purpose |
|------|---------|
| `server/package.json` | `"type":"module"`, Express + Socket.io + jsonwebtoken + dotenv + cors |
| `server/.env` | `DEMO_MODE=true`, JWT secret, test credentials, placeholder API keys |
| `server/.env.example` | Committed template — actual `.env` stays gitignored |
| `server/auth.js` | `signToken` / `verifyToken` (JWT), `checkSubscription` (always active in demo), `TEST_USER` constant |
| `server/index.js` | Express `/auth/login` + Socket.io server on port 3001 |
| `server/demo/priceSimulator.js` | `IndexSimulator` (SPY/QQQ/VIX/BTC/DXY every 2 s), `TickerSimulator` (candle ticks every 1 s, brownian motion with per-symbol volatility) |
| `server/demo/orderFlow.js` | Random SWEEP/BLOCK/SPLIT events every 5–15 s |

**Auth & security flow:**
- Every Socket.io connection goes through a JWT middleware; `next(new Error('auth_error'))` if token missing or invalid
- After auth, `checkSubscription` runs — socket is disconnected with `sub_required` if inactive (demo always returns active)
- API keys stay in `.env`, never visible to the extension

#### Frontend additions

| File | Purpose |
|------|---------|
| `src/lib/socket.js` | Auto-login → fetch JWT → connect Socket.io; token stored in `sessionStorage`; re-fetches on `auth_error` |
| `src/hooks/useMarketData.js` | React hook: surfaces `connected`, `indexPrices`, `liveTick`, `livePrice`, `liveFlows` |

#### Component updates

| Component | Change |
|-----------|--------|
| `src/App.jsx` | `useMarketData` hook; localStorage for `watchlist` + `overlays`; `handleSearch` adds unknown tickers; all live data threaded down |
| `StatusBar.jsx` | Accepts `indexPrices` map + `connected` bool; renders LIVE/DEMO dot indicator |
| `TickerHeader.jsx` | Accepts `livePrice` + `onSearch`; search bar functional (Enter key adds ticker to watchlist + switches); market open/closed status is real-time |
| `ChartPanel.jsx` | Accepts `liveTick`; `useEffect` calls `candleSeries.update()` + `volSeries.update()` on each tick (skipped when frozen) |
| `FlowPanel.jsx` | Accepts `liveFlows`; merges live events on top of static seed data; filter saves to `localStorage` |
| `Watchlist.jsx` | Accepts `tickers` (from localStorage), `onAdd`, `livePrice`; active ticker row shows live price; "+ ADD" inline form |

**Manifest:** Added `http://localhost:3001/*` to `host_permissions`; added `connect-src` to `content_security_policy` for the extension pages.

**Build result:** `npm run build` — 83 modules, 0 errors, 386 KB JS (122 KB gzip, includes socket.io-client).

---

## 2026-05-08 (session 3)

### MV3 Side Panel Migration — Sidebar Shell + Detach

Migrated to a proper Manifest V3 side panel layout. Dropped the 960px+ 3-column layout in favour of a full-width narrow sidebar that works inside Chrome/Opera GX's side panel API.

#### Manifest changes
- Added `windows` permission (required for `chrome.windows.create`)
- `side_panel.default_path` confirmed as `sidepanel.html`
- `host_permissions` and `content_security_policy` retained from previous session

#### Layout rewrite (`src/App.jsx`)
- Removed chart, timeframe tray, overlay settings, and all related state from the main shell
- New layout: `StatusBar` (pinned top) → `TickerHeader` → **two-column body** (`w-40` Watchlist+FlowPanel | `flex-1` RightSidebar tabs) → `Footer` (pinned bottom)
- `w-full h-screen` — width controlled by the browser side panel, not hardcoded

#### Detach logic
- `handleDetach()` calls `chrome.windows.create({ type: 'popup', width: 1280, height: 900 })` in extension context
- Dev fallback: `window.open(..., 'popup,width=1280,height=900')`
- `DetachModal` simplified: snapshot shows ticker, market status, window type, size. "OPEN WINDOW" calls `onConfirm` prop

#### Footer (`src/components/Footer.jsx`)
- Freeze toggle (⏸/▶) moved here since chart pause button was removed from shell
- Accepts `frozen` + `onFreeze` + `onDetach` props

**Build result:** `npm run build` — 73 modules, 0 errors, 213 KB JS (67 KB gzip, Lightweight Charts removed from bundle).

---

## 2026-05-08 (session 4)

### Charting Module — Sidebar Integration

Re-integrated Lightweight Charts into the sidebar at a fixed 280px height above the two-column body.

#### ChartPanel changes (`src/components/ChartPanel.jsx`)
- Added `wrapClass` prop — outer div uses `wrapClass ?? 'flex-1 min-h-0'` so height is caller-controlled
- Sidebar usage: `wrapClass="h-[280px] shrink-0"`
- Watermark text updated to `TICKER – TIMEFRAME` format (em-dash separator)

#### New component: `src/components/ChartControls.jsx`
- Single compact row below the chart: timeframe buttons left (`1m | 5m | 15m | 1h | D`), overlay toggles right (`VWAP | EMA 20 | EMA 50`)
- Each toggle is a hardware-switch pill — active state: colored border + `box-shadow: 0 0 0 1px color`
- Toggling calls `applyOptions({ visible })` on the series ref — no data reload

#### App.jsx additions
- `timeframe` state + `overlays` state restored (with localStorage persistence)
- `overlays` defaults: VWAP on, EMA 20 on, EMA 50 off, EMA 200 off, PDH/PDL on
- `liveTick` threaded from `useMarketData` → ChartPanel (live candle updates every 1 s)

**Build result:** `npm run build` — 82 modules, 0 errors, 385 KB JS (122 KB gzip).

---

## 2026-05-08 (session 5)

### Signal & Intelligence Panels — Flow Tape + AI Tab

Built the live order flow tape and wired the AI thesis panel. Tab order updated to surface the two key intelligence panels first.

#### FlowTab rewrite (`src/components/tabs/FlowTab.jsx`)
Complete replacement of static signal cards with a live streaming tape.

- **Local 2-second generator** — `genEvent()` produces randomised SWEEP/BLOCK/SPLIT events (ticker, contract, price, size, direction) every 2 s using a `setInterval` mounted once on load
- **Freeze / buffer logic:**
  - `pausedRef` + `bufferRef` — refs updated in sync with state so the interval closure always reads current values without re-mounting
  - PAUSED: new events pushed to `buffer` array, not rendered
  - PLAY: entire buffer flushed to top of tape at once, buffer cleared, overlay removed
- **Freeze overlay** — `freeze-stripe` + centred badge showing "⏸ PAUSED · N signals buffered · press PLAY to inject"; overlay covers the list only, header (with PAUSE/PLAY button) stays interactive
- **TapeRow** — two-line row: ticker + type badge | size (line 1), contract + price + timestamp (line 2); left border colour-coded by direction (green/red/amber); all numbers in JetBrains Mono tabular-nums

#### Tab order (`src/components/RightSidebar.jsx`)
Reordered from `FLOW | ECON | DISC | AI` → `FLOW | AI | DISC | ECON` so the two intelligence panels are the default-visible tabs.

#### TV ↗ button (`src/components/StatusBar.jsx`)
- `activeTicker` prop added; `onClick` opens `https://www.tradingview.com/chart/?symbol={ticker}` in a new tab

**Build result:** `npm run build` — 82 modules, 0 errors, 386 KB JS (122 KB gzip).

---

## 2026-05-08 (session 6)

### Phase 4 — Live Data Bridge / Mock Data Service

Audit against Gemini's Phase 4 prompt confirmed that Steps 2, 3 (freeze logic, ticker header), and 4 (TV button) were already fully implemented. The genuine gap was a client-side fallback: without the backend server running, the status bar and ticker header went static.

#### New file: `src/lib/mockDataService.js`
Central client-side simulation hub — mirrors the server's three data streams entirely in the browser.

- **Pub/sub**: `on(event, fn)` / `off(event, fn)` / `emit(event, data)` — lightweight internal event system, no external dependency
- **Index stream** (`index_tick`, every 3 s): SPY / QQQ / VIX / BTC / DXY brownian-motion walk with per-symbol volatility; emits `{ price, change, up }` per symbol
- **Ticker stream** (`price_tick`, every 1 s): active ticker candle (open/high/low/close/volume) with correct candle boundary logic per timeframe; emits full `{ ticker, candle, price, change, changeP, up }` shape
- **Flow stream** (`flow_event`, every 2 s): same `genFlow()` generator as FlowTab but centralised; emits `{ ticker, contract, price, size, sizeVal, type, bull, ts }`
- **API**: `start(ticker, timeframe)`, `setTicker(ticker, timeframe)`, `stop()` — called by `useMarketData`

#### Updated: `src/hooks/useMarketData.js`
- If `initSocket()` resolves to `null` (server offline or unreachable), automatically calls `mockDataService.start()` and subscribes to the same three event names
- If server is online, Socket.io is used as before — mock service is not started
- `setConnected(true)` is called in both paths so the UI indicator stays green regardless
- On ticker/timeframe change: routes to `mockDataService.setTicker()` or `socket.emit('subscribe_ticker')` based on which path is active
- Cleanup: `mockDataService.stop()` called on unmount when in mock mode

**Result**: The extension now streams live-feeling data with or without the backend server running. Status bar indices, ticker header price, chart candle ticks, and flow events all update continuously in both modes.

**Build result:** `npm run build` — 83 modules, 0 errors, 389 KB JS (124 KB gzip).

---

## 2026-05-08 (session 7)

### Phase 5 — Global State & Persistence

Audit confirmed search bar, data reinit on ticker change, and iOS toggle already existed. New work: chrome.storage integration, cross-window sync, SYNCING animation, toast notifications.

#### New file: `src/lib/storage.js`
Thin async wrapper around `chrome.storage.local` with automatic `localStorage` fallback for dev (browser tab context).
- `save(key, value)` — writes to chrome.storage or localStorage
- `load(key, fallback)` — reads single key
- `loadAll(keys)` — batch read, returns plain object
- `onChange(fn)` — subscribes to `chrome.storage.onChanged` (cross-window); returns cleanup fn

#### New file: `src/components/Toast.jsx`
Floating notification bar: fades in on mount, auto-dismisses after 2.2 s, calls `onDone` at 2.7 s so parent can clear message state. Used for iOS sync confirmation.

#### ChartPanel — SYNCING overlay
- `syncing` boolean state; `prevTickerRef` tracks last ticker
- `useEffect` on `[ticker]`: if ticker changed, `setSyncing(true)` for 700 ms then clears
- Overlay: semi-transparent `bg-[#0c1119]/60` with pulsing `◈ SYNCING…` badge (z-20, above freeze overlay)

#### App.jsx — full persistence + sync rewrite
- `loadAll` on mount loads `td_ticker`, `td_timeframe`, `td_overlays`, `td_watchlist`, `td_ios_sync` and hydrates state
- `onChange` listener applies remote updates from other windows — sidebar ↔ detached window stay in sync without polling
- Five `useEffect` hooks persist each piece of state immediately on change
- `iosSync` state lifted from Footer into App.jsx; `handleIosSync` toggles + fires toast ("Mobile Sync Active" / "Mobile Sync Off")
- `Toast` rendered at root level so it overlays all panels

#### Footer
- `syncOn` local state removed; now receives `iosSync` + `onIosSync` props from App.jsx

**Build result:** `npm run build` — 85 modules, 0 errors, 391 KB JS (124 KB gzip).
