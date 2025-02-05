import ReactDOM from 'react-dom/client'

import { enableDebugTool, CSSModel3D } from '@xrsdk/react'
import { CSSProperties } from 'styled-components'
import { useRef, useState } from 'react'

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
    marginBottom: '140px',
    transform: `translateX(${translateX}px) translateY(${translateY}px) rotateZ(${rotateZ}deg)`,
    // transformOrigin: 'top center',
    backgroundColor: 'red',
    opacity: 0.8,
  }

  const onToggleDisplay = () => {
    if (ref.current) {
      ref.current.style.display =
        ref.current.style.display === '' ||
        ref.current.style.display === 'block'
          ? 'none'
          : 'block'
    }
  }

  const onToggleOpacity = () => {
    if (ref.current) {
      ref.current.style.opacity =
        ref.current.style.opacity !== '0.5' ? '0.5' : '0.8'
    }
  }

  const onToggleVisible = () => {
    if (ref.current) {
      ref.current.style.visibility =
        ref.current.style.visibility === 'visible' ||
        ref.current.style.visibility === ''
          ? 'hidden'
          : 'visible'
    }
  }
  const [contentMode, setContentMode] = useState<'fit' | 'fill'>('fit')

  const handleContentModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const contentMode = event.target.value as 'fit' | 'fill'
    setContentMode(contentMode)
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
        contentMode={contentMode}
      />
      <div>
        <button className="btn btn-primary" onClick={onToggleDisplay}>
          display toggle
        </button>
        <button className="btn btn-primary" onClick={onToggleOpacity}>
          display opacity
        </button>
        <button className="btn btn-primary" onClick={onToggleVisible}>
          display visible
        </button>
      </div>

      <select
        value={contentMode}
        onChange={handleContentModeChange}
        className="p-2  bg-purple-50 text-black rounded-lg transition-colors"
      >
        <option value="fit">fit</option>
        <option value="fill">fill</option>
      </select>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
