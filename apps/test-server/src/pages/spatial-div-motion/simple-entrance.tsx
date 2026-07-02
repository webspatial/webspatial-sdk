import { useState } from 'react'
import { useAnimation } from '@webspatial/react-sdk'
import { btnCls } from './shared'

/** Segment-equivalent demo: opacity + translate.z over 0.8s (native segment path on AVP). */
const SIMPLE_ENTRANCE = {
  from: {
    opacity: 0.6,
    transform: { translate: { z: 10 } },
  },
  to: {
    opacity: 1,
    transform: { translate: { z: 100 } },
  },
  duration: 0.8,
  timingFunction: 'easeOut' as const,
  autoStart: true,
}

function SimpleEntranceCard() {
  const [motion, , style] = useAnimation(SIMPLE_ENTRANCE)

  return (
    <div
      enable-xr
      {...{ 'xr-animation': motion as any }}
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

/** Fade + slide up via useAnimation({ from, to, duration, … }) */
export function SpatialDivMotionSimpleEntrancePage() {
  const [key, setKey] = useState(0)

  return (
    <div className="p-6 text-gray-200">
      <h1 className="text-xl font-bold mb-2">Plan B — simple() entrance</h1>
      <p className="text-sm text-gray-400 mb-2">
        Fade + depth via <code>simple()</code>: opacity 0.6→1, translate.z
        10→100px over 0.8s (segment-native on AVP when <code>motion</code> is
        wired). Larger +z moves the panel farther in depth on AVP.
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
