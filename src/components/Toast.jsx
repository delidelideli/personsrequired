import React, { useEffect, useState } from 'react'

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const hide  = setTimeout(() => setVisible(false), 2200)
    const clear = setTimeout(() => onDone?.(),         2700)
    return () => { clearTimeout(hide); clearTimeout(clear) }
  }, [message])

  if (!message) return null

  return (
    <div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 border border-[#1e3352] bg-[#0c1119] font-mono text-[10px] text-slate-300 pointer-events-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {message}
    </div>
  )
}
