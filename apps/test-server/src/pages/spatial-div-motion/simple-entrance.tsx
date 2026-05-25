import { useState } from 'react'
import { useSpatialDivMotion } from '@webspatial/react-sdk'
import { btnCls } from '../spatial-div-animation/shared'

/** Match Plan A fade-in depth semantics: approach from z=-50 to rest (z=0), not larger +z. */
const SIMPLE_ENTRANCE = {
  from: {
    opacity: 0.6,
    transform: { translate: { z: 10 } },
  },
  to: {
    opacity: 1,
    transform: { translate: { z: 100 } },
  },
  duration: 3.8,
  timingFunction: 'easeOut' as const,
  autoStart: true,
}

function SimpleEntranceCard() {
  const { style, motion } = useSpatialDivMotion.simple(SIMPLE_ENTRANCE)

  return (
    <div
      enable-xr
      motion={motion}
      className="box rounded-lg"
      style={{
        width: 320,
        height: 140,
        background: '#312e81',
        ...style,
      }}
    >
      <p className="text-white p-6 text-lg">Hello motion</p>
    </div>
  )
}

/** Fade + slide up via useSpatialDivMotion.simple() sugar */
export function SpatialDivMotionSimpleEntrancePage() {
  const [key, setKey] = useState(0)

  return (
    <div className="p-6 text-gray-200">
      <h1 className="text-xl font-bold mb-2">Plan B — simple() entrance</h1>
      <p className="text-sm text-gray-400 mb-2">
        Fade + depth entrance: translate.z -50→0, opacity 0→1 (same depth axis
        as Plan A fade-in). Positive +z pushes the panel away on AVP.
      </p>
      <div className="mb-4">
        <button
          type="button"
          className={btnCls}
          onClick={() => setKey(k => k + 1)}
        >
          Replay
        </button>
      </div>
      <SimpleEntranceCard key={key} />
    </div>
  )
}
