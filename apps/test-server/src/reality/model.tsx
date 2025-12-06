import React, { useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Model } from '@webspatial/react-sdk'

function App() {
  const ref = useRef<any>(null)
  return (
    <div style={{ padding: 16 }}>
      <h2>Model tag demo</h2>
      <div style={{ width: 400, height: 400 }}>
        <Model
          ref={ref}
          src="/assets/vehicle-speedster.usdz"
          onLoad={() => {
            if (ref.current) {
              ref.current.playbackRate = 1.25
            }
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => ref.current && ref.current.play()}>play</button>
        <button onClick={() => ref.current && ref.current.pause()}>
          pause
        </button>
        <button
          onClick={() =>
            ref.current &&
            (ref.current.playbackRate = (ref.current.playbackRate || 1) + 0.25)
          }
        >
          faster
        </button>
        <button
          onClick={() =>
            ref.current &&
            (ref.current.playbackRate = Math.max(
              0.25,
              (ref.current.playbackRate || 1) - 0.25,
            ))
          }
        >
          slower
        </button>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
