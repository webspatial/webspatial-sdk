import ReactDOM from 'react-dom/client'

import { enableDebugTool, CSSModel3D } from '@xrsdk/react'
import { CSSProperties } from 'styled-components'
import { useRef } from 'react'

enableDebugTool()

function App() {
  const translateX = 100
  const translateY = 0
  const rotateZ = 0

  const ref = useRef<HTMLDivElement | null>(null)

  ;(window as any).ref = ref

  const styleOuter: CSSProperties = {
    // '--xr-back': 31,
    // visibility: 'hidden',
    position: 'relative',
    width: '50%',
    height: '50%',
    transform: `translateX(${translateX}px) translateY(${translateY}px) rotateZ(${rotateZ}deg)`,
    // transformOrigin: 'top center',
    backgroundColor: 'red',
    opacity: 0.8,
  }

  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <CSSModel3D
        ref={ref}
        style={styleOuter}
        modelUrl="/src/assets/FlightHelmet.usdz"
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
