// Server-side timeframe utilities — mirrors src/lib/timeframeUtils.js
// Kept separate so the server has no dependency on the Vite/browser build.

export function tfToSeconds(tf) {
  const u = String(tf).toUpperCase()
  if (u === 'D') return 86_400
  if (u === 'W') return 604_800
  if (u === 'M') return 2_592_000
  const m = u.match(/^(\d+)(M|H)$/)
  if (m) return m[2] === 'H' ? Number(m[1]) * 3_600 : Number(m[1]) * 60
  return 300
}

export function tfBarCount(secs) {
  if (secs <=    60) return 240
  if (secs <=   300) return 240
  if (secs <=   900) return 200
  if (secs <= 1_800) return 200
  if (secs <= 3_600) return 200
  if (secs <= 14_400) return 180
  if (secs <= 86_400) return 200
  if (secs <= 604_800) return 100
  return 60
}
