import ReactDOM from 'react-dom/client'

import { enableDebugTool, CSSModel3D } from '@xrsdk/react'
import { CSSProperties } from 'styled-components'
import { useRef, useState } from 'react'
import { ModelDragEvent } from '@xrsdk/runtime'

enableDebugTool()

function App() {
  // const translateX = useState(0)
  // const translateY = useState(0)
  // const translateZ = useState(0)

  const [tapFlag, setTapFlag] = useState(true)

  const ref = useRef<HTMLDivElement | null>(null)

  ;(window as any).ref = ref

  const styleOuter: CSSProperties = {
    '--xr-back': tapFlag ? 31 : 100,
    // visibility: 'hidden',
    position: 'relative',
    width: '50%',
    height: '50%',
    marginBottom: '140px',
    // transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}deg)`,
    // transformOrigin: 'top center',
    // backgroundColor: 'red',
    // opacity: 0.8,
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
        resizable={resizable}
        aspectRatio={aspectRatio}
        onSuccess={() => {
          console.log('onLoadSuccess')
        }}
        onFailure={(errorReason: string) => {
          console.log('onLoadError', errorReason)
        }}
        onDragStart={(dragEvent: ModelDragEvent) => {
          console.log('onDragStart', dragEvent)
        }}
        onDrag={(dragEvent: ModelDragEvent) => {
          console.log(
            'onDrag x',
            dragEvent.translation3D.x,
            dragEvent.startLocation3D.x,
          )

          ref.current!.style.transform = `translateX(${dragEvent.translation3D.x}px) translateY(${dragEvent.translation3D.y}px) translateZ(${dragEvent.translation3D.z}px)`
        }}
        onDragEnd={(dragEvent: ModelDragEvent) => {
          console.log('onDragEnd', dragEvent)
          // ref.current!.style.transform = 'none'
        }}
        // onTap={() => {
        //   setTapFlag(v => !v)
        // }}
        // onDoubleTap={() => {
        //   console.log('onDoubleTap')
        // }}
        // onLongPress={() => {
        //   console.log('onLongPress')
        // }}
      >
        <div> this is place holder when failure </div>
      </CSSModel3D>

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
