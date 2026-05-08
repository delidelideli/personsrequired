import React, { useState } from 'react'
import FlowTab from './tabs/FlowTab'
import EconTab from './tabs/EconTab'
import DiscTab from './tabs/DiscTab'
import AITab from './tabs/AITab'

const TABS = ['FLOW', 'AI', 'DISC', 'ECON']

export default function RightSidebar({ ticker = 'NVDA' }) {
  const [active, setActive] = useState('FLOW')

  return (
    <div className="flex flex-col h-full">
      <div className="flex shrink-0 border-b border-[#1e3352]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="flex-1 py-1.5 text-[10px] font-mono border-r border-[#1e3352] last:border-r-0 transition-colors"
            style={
              active === tab
                ? { color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.07)', boxShadow: 'inset 0 -1px 0 #38bdf8' }
                : { color: '#475569' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {active === 'FLOW' && <FlowTab ticker={ticker} />}
        {active === 'ECON' && <EconTab />}
        {active === 'DISC' && <DiscTab />}
        {active === 'AI'   && <AITab ticker={ticker} />}
      </div>
    </div>
  )
}
