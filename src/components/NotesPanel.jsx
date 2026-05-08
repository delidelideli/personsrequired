import React, { useState } from 'react'

export default function NotesPanel() {
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col h-full overflow-hidden border-t border-[#1e3352] w-full">
      <div className="flex items-center px-2 py-1 border-b border-[#1e3352] shrink-0 bg-[#0c1119]">
        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Notes</span>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Trade notes..."
        spellCheck={false}
        className="flex-1 w-full bg-transparent resize-none px-2 py-1.5 text-[10px] font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none leading-relaxed"
      />
    </div>
  )
}
