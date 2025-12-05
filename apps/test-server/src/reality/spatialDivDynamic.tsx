import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

function App() {
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

  const styleContainer: React.CSSProperties = {
    enableXr: true,
  }

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
    <div style={styleContainer}>
      <div className="pl-5 pt-2">
        <h1 className="text-2xl text-black">Spatial Div Dynamic Demo</h1>
        <div className="flex gap-2 my-3">
          <button
            className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={() => setPosX(x => (x === 0 ? 30 : 0))}
          >
            Toggle Position
          </button>
          <button
            className="select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            onClick={() => setRotOn(s => !s)}
          >
            Toggle Rotation
          </button>
        </div>
      </div>
      <div enable-xr style={styleCard}>
        Spatial Div
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
