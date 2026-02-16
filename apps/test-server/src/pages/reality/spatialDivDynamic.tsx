import React, { useEffect, useRef, useState } from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

export default function RealitySpatialDivDynamic() {
  const [posX, setPosX] = useState(0)
  const [rotOn, setRotOn] = useState(false)
  const animRef = useRef<number | null>(null)
  const [deg, setDeg] = useState(0)

  useEffect(() => {
    if (rotOn) {
      function step() {
        setDeg(d => d + 1)
        animRef.current = requestAnimationFrame(step)
      }
      step()
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    return () => {}
  }, [rotOn])

  const styleCard: React.CSSProperties = {
    width: '240px',
    height: '160px',
    backgroundColor: '#2244aa',
    color: 'white',
    '--xr-back': 120 as any,
    '--xr-depth': 80 as any,
    transform: `translateX(${posX}px) rotateZ(${deg}deg)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
  }

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-4">Spatial Div Dynamic Demo</h1>
      <div className="flex gap-2 mb-8 bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
        <button
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => setPosX(x => (x === 0 ? 30 : 0))}
        >
          Toggle Position
        </button>
        <button
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => setRotOn(s => !s)}
        >
          Toggle Rotation
        </button>
      </div>

      <div className="flex justify-center items-center h-64 border border-dashed border-gray-800 rounded-2xl">
        <div enable-xr style={styleCard}>
          Spatial Div
        </div>
      </div>
    </div>
  )
}
