# TradeDesk — Future Setup Guide

Everything needed to take this from demo to a fully live, commercial product.
Written so either a developer or Claude can pick this up and know exactly what to do.

---

## 1. Real-Time Price Data

**Current state:** Brownian-motion simulators in `server/dataProvider.js` (`startIndexStream`, `startTickerStream`).

**What to swap:** Replace those two methods with a real upstream WebSocket.

### Recommended provider: Polygon.io
- Equities, options, indices, forex, crypto — one provider for everything
- Starter plan: free (delayed). Stocks Starter: ~$29/mo (real-time US equities)
- WebSocket docs: `wss://socket.polygon.io/stocks`
- Subscribe: `{ action: "subscribe", params: "A.NVDA" }` for per-second aggregates

### Timeframe mapping for historical REST calls
```
1m  → /v2/aggs/ticker/{t}/range/1/minute/{from}/{to}
5m  → /v2/aggs/ticker/{t}/range/5/minute/{from}/{to}
30m → /v2/aggs/ticker/{t}/range/30/minute/{from}/{to}
1h  → /v2/aggs/ticker/{t}/range/1/hour/{from}/{to}
4h  → /v2/aggs/ticker/{t}/range/4/hour/{from}/{to}
D   → /v2/aggs/ticker/{t}/range/1/day/{from}/{to}
W   → /v2/aggs/ticker/{t}/range/1/week/{from}/{to}
M   → /v2/aggs/ticker/{t}/range/1/month/{from}/{to}
```

### Index bar symbols (StatusBar)
- SPY, QQQ — equities feed
- VIX — `wss://socket.polygon.io/indices`, symbol `I:VIX`
- BTC — `wss://socket.polygon.io/crypto`, symbol `X:BTCUSD`
- DXY — forex feed or a DXY ETF (UUP) as proxy

### What to change in code
- `server/dataProvider.js` → replace `startIndexStream` and `startTickerStream` bodies
- `server/dataProvider.js` → replace `getHistory` body with a Polygon REST fetch + cache
- Add `POLYGON_API_KEY=...` to `server/.env`

---

## 2. Options Flow Data

**Current state:** Random sweep/block/split events in `server/demo/orderFlow.js`.

**What to swap:** `server/dataProvider.js → startFlowStream`

### Provider options
| Provider | Cost | Notes |
|----------|------|-------|
| Unusual Whales | ~$50/mo | Best flow data, REST + WebSocket API |
| Market Chameleon | ~$40/mo | Good for unusual activity scanning |
| Tradier | Free tier | Options chain data, not real-time flow |

### Data shape to map onto
The frontend expects `flow_event` with this shape:
```js
{
  id, ticker, type,      // type: 'SWEEP' | 'BLOCK' | 'SPLIT'
  bull,                  // true=bullish, false=bearish, null=neutral
  contract,              // e.g. '950C 5/31'
  price, size, sizeVal,  // sizeVal is numeric (for $50k+/$100k+ filter)
  ts                     // Date.now() timestamp
}
```
Map whatever the real provider sends into this shape in `startFlowStream`.

---

## 3. Historical Data Caching

**Current state:** `server/dataProvider.getHistory` generates candles fresh every call.

**What to add:**
- Cache historical responses so the same ticker+timeframe isn't re-fetched from the API every time a user opens the chart
- TTL per timeframe: `1m` = 30s, `5m` = 2min, `1h` = 10min, `D` = 1hr, `W/M` = 6hr

### Simple in-memory cache (small scale)
```js
const historyCache = new Map()   // key: `${ticker}:${timeframe}`
async function getHistory(ticker, timeframe) {
  const key = `${ticker}:${timeframe}`
  const cached = historyCache.get(key)
  if (cached && Date.now() - cached.ts < TTL_MS[timeframe]) return cached.data
  const data = await fetchFromPolygon(ticker, timeframe)
  historyCache.set(key, { data, ts: Date.now() })
  return data
}
```

### Redis cache (multi-server scale)
- Use Upstash (free tier, serverless Redis)
- Add `REDIS_URL=...` to `server/.env`
- Replace the Map above with `redis.get` / `redis.setex`

---

## 4. Upstream WebSocket Broker (Multi-user)

**Current state:** Each connected socket creates its own simulator. Fine for 1 user in demo — breaks with real APIs (one connection per user = massive rate limit cost).

**What to build in `server/`:**
- One upstream Polygon WebSocket connection shared across all clients
- A symbol subscription tracker: `Map<symbol, Set<socketId>>`
- When a client subscribes to NVDA, add them to the NVDA set; Polygon WS is already subscribed
- When last client drops NVDA, send unsubscribe to Polygon
- Fan incoming Polygon messages out to all sockets in the relevant set

This is the most complex backend change — build it after the single-user real data path is working.

---

## 5. Auth & User Management

**Current state:** Hardcoded `TEST_USER` in `server/auth.js`. Demo mode auto-logs in any request.

### What to build
1. **User database** — Supabase (recommended: free tier, PostgreSQL + built-in auth)
   - Tables: `users`, `subscriptions`
   - `users`: id, email, password_hash, created_at
   - `subscriptions`: user_id, stripe_customer_id, stripe_subscription_id, plan, active, expires_at

2. **Login UI** — Currently auto-login in `src/lib/socket.js`. Add a login screen to the extension:
   - Email + password form
   - POST `/auth/login` with real credentials
   - Store JWT in `sessionStorage` (already done)

3. **`server/auth.js`** — replace `checkSubscription` stub:
   ```js
   // Query your DB instead of returning { active: true }
   const sub = await db.subscriptions.findOne({ user_id: userId, active: true })
   return { active: !!sub, plan: sub?.plan ?? null }
   ```

4. **Token refresh** — Current JWTs expire in 24h. Add a `/auth/refresh` endpoint and handle expiry in `socket.js`.

5. **Add** `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `server/.env`

---

## 6. Stripe Integration

**Current state:** `checkSubscription` in `server/auth.js` always returns `{ active: true }` in demo mode.

### What to build
1. **Products & prices** in Stripe dashboard — create Pro plan price ID
2. **Checkout flow** — a hosted Stripe Checkout page or embedded form
3. **Webhook endpoint** on server — `POST /stripe/webhook`
   - Events to handle: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - On each event: update the `subscriptions` table in your DB
4. **`server/.env`** — add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
5. **`checkSubscription`** — query DB (not Stripe API directly on every connection — too slow)

---

## 7. Multi-Ticker Watchlist Prices

**Current state:** Only the active ticker gets live price updates. Watchlist shows static seed data for inactive tickers.

### What to add
- **Server:** handle `subscribe_watchlist` event — receives an array of symbols, streams a `watchlist_tick` event with prices for all of them
- **Client (`useMarketData.js`):** emit `subscribe_watchlist` on connect and when watchlist changes; handle `watchlist_tick` events
- **`Watchlist.jsx`:** use a `watchlistPrices` map instead of static `DEFAULTS`

---

## 8. Environment Variables

### Frontend (`/.env` in project root — gitignored)
```
VITE_SERVER_URL=http://localhost:3001
```
In production, set this to your deployed server URL: `https://api.tradedesk.io`

### Server (`/server/.env` — gitignored)
```
DEMO_MODE=true
PORT=3001
JWT_SECRET=your_secret_here
TEST_EMAIL=test@tradedesk.io
TEST_PASSWORD=demo1234

# Add when ready:
POLYGON_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
REDIS_URL=
```

---

## 9. CORS & Extension Security

**Current state:** `cors({ origin: '*' })` on the server — fine for local dev, not for production.

### What to change
1. Get the production extension ID from the Chrome Web Store after first publish
2. Update `server/index.js`:
   ```js
   cors({ origin: `chrome-extension://YOUR_EXTENSION_ID` })
   ```
3. Update `public/manifest.json`:
   - `host_permissions`: replace `http://localhost:3001/*` with `https://api.tradedesk.io/*`
   - `content_security_policy.extension_pages` connect-src: same replacement
4. Update `VITE_SERVER_URL` to `https://api.tradedesk.io`

**Note:** The extension ID changes between dev (unpacked) and production (Web Store). Keep a separate dev CORS allowlist during development.

---

## 10. Chrome Web Store Deployment

### Requirements checklist
- [ ] Developer account at `chrome.google.com/webstore/devconsole` — $5 one-time fee
- [ ] Extension packaged: `npm run build` then zip the `dist/` folder
- [ ] Store listing:
  - [ ] Name, short description (132 chars max), detailed description
  - [ ] Screenshots: at least 1280×800 or 640×400 (up to 5)
  - [ ] Promotional tile: 440×280 px
  - [ ] Privacy policy URL (required — must explain what data you collect)
  - [ ] Category: Productivity
- [ ] Manifest review: Anthropic reviews for policy compliance (usually 1–7 days)
- [ ] Extension ID is assigned permanently — use it to lock CORS

### Versioning
- Bump `version` in `public/manifest.json` for every update
- Updates go through review (usually faster than first submission)

---

## 11. Server Hosting

**Recommended for launch:** Railway (`railway.app`)
- Deploys from GitHub automatically
- $5/mo hobby plan covers a small Node.js server
- Built-in SSL, custom domains, env var management

**Alternatives:** Fly.io, Render, Heroku

### What the server needs
- Node.js 18+
- Persistent env vars (set in Railway dashboard, not `.env`)
- WebSocket support (all listed providers support this)
- Outbound internet for upstream API connections

---

## 12. Mobile Sync (iOS Toggle)

**Current state:** The iOS toggle in the footer is UI-only — no actual sync.

### What to build
- A companion web app or React Native app
- Backend: persist user state (active ticker, watchlist, overlays) in the DB, not just `chrome.storage`
- When `iosSync` is toggled on, write state to DB; mobile app reads from DB via REST or WebSocket
- Or: use Supabase Realtime for instant sync without building a custom bridge

---

## 13. Error Handling & Monitoring

### Server
- **Upstream disconnect recovery:** if the Polygon WS drops, reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Per-socket error events:** emit `{ event: 'error', message }` so the UI can show an alert
- **Sentry:** `npm install @sentry/node` — catches uncaught exceptions and unhandled rejections

### Client
- **Sentry browser SDK:** catches React errors and failed fetches
- **Connection status:** `connected` state already surfaces in `StatusBar` — expand to show specific error messages when `sub_required` or auth fails

---

## 14. Performance Notes

- **Debounce ticker switching:** rapid watchlist clicks spam `subscribe_ticker`. Add a 200ms debounce in `useMarketData` before emitting.
- **History fetch deduplication:** if ticker changes twice quickly, the first AbortController cancels the stale fetch (already implemented). On real APIs, also cancel the upstream Polygon request.
- **Flow tape cap:** already capped at 20 events in `useMarketData`. Keep this — flow events can arrive very fast in live markets.
- **Chart data size:** daily data going back 200 bars = small. 1-minute data going back 240 bars = still small. Lightweight Charts handles this easily. No pagination needed for these counts.
