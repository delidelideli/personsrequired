// Thin wrapper around chrome.storage.local with localStorage fallback for dev.
// All methods are async so callers don't need to branch on environment.

const USE_CHROME = typeof chrome !== 'undefined' && !!chrome.storage?.local

export async function save(key, value) {
  if (USE_CHROME) {
    return chrome.storage.local.set({ [key]: value })
  }
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export async function load(key, fallback) {
  if (USE_CHROME) {
    const result = await chrome.storage.local.get(key)
    return key in result ? result[key] : fallback
  }
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

// Batch load — returns an object keyed by the requested keys.
export async function loadAll(keys) {
  if (USE_CHROME) {
    return chrome.storage.local.get(keys)
  }
  const result = {}
  for (const key of keys) {
    try {
      const v = localStorage.getItem(key)
      if (v !== null) result[key] = JSON.parse(v)
    } catch {}
  }
  return result
}

// Subscribe to storage changes from any window.
// Returns a cleanup function.
export function onChange(fn) {
  if (!USE_CHROME) return () => {}

  const listener = (changes, area) => {
    if (area !== 'local') return
    const updates = {}
    for (const [key, { newValue }] of Object.entries(changes)) {
      updates[key] = newValue
    }
    fn(updates)
  }

  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
