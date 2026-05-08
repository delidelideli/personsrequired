// Converts any timeframe string to seconds.
// Handles built-ins (1m, 5m, 15m, 30m, 1h, 4h, D, W, M)
// and custom strings from the picker (6H, 45M, 2H, etc.)
export function tfToSeconds(tf) {
  const u = String(tf).toUpperCase()
  if (u === 'D') return 86_400
  if (u === 'W') return 604_800
  if (u === 'M') return 2_592_000   // 30-day month
  const m = u.match(/^(\d+)(M|H)$/)
  if (m) return m[2] === 'H' ? Number(m[1]) * 3_600 : Number(m[1]) * 60
  return 300  // fallback: 5m
}

// How many bars to render based on bar duration
export function tfBarCount(secs) {
  if (secs <=    60) return 240   // 1m  → 4 h of data
  if (secs <=   300) return 240   // 5m  → 20 h
  if (secs <=   900) return 200   // 15m → ~2 days
  if (secs <= 1_800) return 200   // 30m → ~4 days
  if (secs <= 3_600) return 200   // 1h  → ~8 days
  if (secs <= 14_400) return 180  // 4h  → ~30 days
  if (secs <= 86_400) return 200  // D   → 200 days
  if (secs <= 604_800) return 100 // W   → ~2 years
  return 60                        // M+
}

// True when the timeframe is daily or longer (use date labels on axis)
export function tfIsDaily(tf) {
  return tfToSeconds(tf) >= 86_400
}
