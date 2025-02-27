// @ts-nocheck
import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  ModelNew,
  ModelElement,
  ModelEvent,
  ModelDragEvent,
} from '@xrsdk/react'
import { CSSProperties } from 'styled-components'
import { useRef, useState } from 'react'

enableDebugTool()

function App() {
  const [tapFlag, setTapFlag] = useState(true)

  const ref = useRef<ModelElement | null>(null)

  ;(window as any).ref = ref

  const styleOuter: CSSProperties = {
    '--xr-back': tapFlag ? 31 : 100,
    // visibility: 'hidden',
    position: 'relative',
    width: '50%',
    height: '50%',
    marginBottom: '140px',
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

  const [resizable, setResizable] = useState(true)

  const handleResizableChange = () => {
    setResizable(v => !v)
  }

  const [aspectRatio, setAspectRatio] = useState(0)
  const handleAspectRatioChange = () => {
    setAspectRatio(v => (v === 0 ? 16 / 9 : 0))
  }

  // test toggle model url
  const [modelUrl, setModelUrl] = useState('/src/assets/FlightHelmet.usdz')
  const handleToggleModel = () => {
    if (ref.current) {
      setModelUrl(v =>
        v === '/src/assets/FlightHelmet.usdz'
          ? '/src/assets/ball.usdz'
          : '/src/assets/FlightHelmet.usdz',
      )
    }
  }

  return (
    <div className="w-screen h-screen  ">
      <div className="text-blue   bg-base-200	bg-clip-border px-6 py-6  ">
        <a href="#" onClick={() => history.go(-1)}>
          Go Back
        </a>
      </div>

      <ModelNew
        ref={ref}
        style={styleOuter}
        // modelUrl={modelUrl}
        contentMode={contentMode}
        resizable={resizable}
        aspectRatio={aspectRatio}
        onLoad={(event: ModelEvent) => {
          console.log('onLoad', event.target.ready, event.target.currentSrc)
        }}
        onDragStart={(dragEvent: ModelDragEvent) => {
          console.log('onDragStart', dragEvent)
        }}
        onDrag={(dragEvent: ModelDragEvent) => {
          ref.current!.style.transform = `translateX(${dragEvent.translation3D.x}px) translateY(${dragEvent.translation3D.y}px) translateZ(${dragEvent.translation3D.z}px)`
        }}
        onDragEnd={(dragEvent: ModelDragEvent) => {
          console.log(
            'onDragEnd',
            dragEvent,
            dragEvent.target.ready,
            dragEvent.target.currentSrc,
          )
          ref.current!.style.transform = 'none'
        }}
        onTap={(event: ModelEvent) => {
          setTapFlag(v => !v)
          console.log('onTap', event)
        }}
        onDoubleTap={(event: ModelEvent) => {
          console.log('onDoubleTap', event)
        }}
        onLongPress={(event: ModelEvent) => {
          console.log('onLongPress', event)
        }}
      >
        <source src={modelUrl} type="model/vnd.usdz+zip" />

        <div> this is place holder when failure </div>
      </ModelNew>

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

        <button className="btn btn-primary" onClick={handleResizableChange}>
          resizable
        </button>

        <button className="btn btn-primary" onClick={handleAspectRatioChange}>
          aspectRatio
        </button>

        <button className="btn btn-primary" onClick={handleToggleModel}>
          toggle model url
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
