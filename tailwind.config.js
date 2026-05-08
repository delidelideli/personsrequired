/** @type {import('tailwindcss').Config} */
export default {
  content: ['./sidepanel.html', './src/**/*.{js,jsx}'],

  theme: {
    // ── Box shadows ───────────────────────────────────────────────────────────
    // Style guide: "No drop shadows." Wipe the Tailwind defaults entirely.
    // Only neon rings (0 0 0 1px) are permitted — used for active hw-switch state.
    boxShadow: {
      none:          'none',
      sm:            'none',
      DEFAULT:       'none',
      md:            'none',
      lg:            'none',
      xl:            'none',
      '2xl':         'none',
      inner:         'none',
      'neon-up':     '0 0 0 1px #00ff88',
      'neon-down':   '0 0 0 1px #ff0055',
      'neon-blue':   '0 0 0 1px #38bdf8',
      'neon-amber':  '0 0 0 1px #f59e0b',
      'neon-purple': '0 0 0 1px #a855f7',
    },

    extend: {
      // ── Color palette ───────────────────────────────────────────────────────
      // Exact values from style guide — no approximations.
      colors: {
        td: {
          bg:     '#0c1119',  // Deep Slate — all panel backgrounds
          border: '#1e3352',  // panel / grid borders (1px, no shadow)
          up:     '#00ff88',  // Emerald — bullish price action
          down:   '#ff0055',  // Vivid Rose — bearish price action
          blue:   '#38bdf8',  // accent (active tab, TradingView, L2)
          amber:  '#f59e0b',  // accent (AI thesis header, EMA 50, split flow)
          purple: '#a855f7',  // accent (EMA 200)
        },
      },

      // ── Border ─────────────────────────────────────────────────────────────
      // Makes bare `border` class resolve to td-border without a modifier.
      borderColor: {
        DEFAULT: '#1e3352',
      },

      // ── Typography ─────────────────────────────────────────────────────────
      // Full fallback stack so JetBrains Mono loads or degrades gracefully.
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },

      // Named size scale for price / numeric displays.
      // lineHeight is 1 everywhere — prices must not shift the grid.
      fontSize: {
        'num-2xl': ['22px', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'num-xl':  ['18px', { lineHeight: '1', fontWeight: '600', letterSpacing: '-0.01em' }],
        'num-lg':  ['14px', { lineHeight: '1', fontWeight: '600' }],
        'num-md':  ['11px', { lineHeight: '1', fontWeight: '500' }],
        'num-sm':  ['10px', { lineHeight: '1', fontWeight: '400' }],
        'num-xs':  ['9px',  { lineHeight: '1', fontWeight: '400' }],
        'label':   ['9px',  { lineHeight: '1', letterSpacing: '0.08em' }],
      },
    },
  },

  plugins: [],
}
