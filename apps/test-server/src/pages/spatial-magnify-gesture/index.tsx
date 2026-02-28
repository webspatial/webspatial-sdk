import { useRef, useState } from 'react'
import './index.css'
import {
  enableDebugTool,
  Model,
  SpatialMagnifyEvent,
  ModelSpatialMagnifyEvent,
} from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  const [scale, setScale] = useState(1)
  const [magnification, setMagnification] = useState(1)

  const style = {
    width: '300px',
    height: '300px',
    '--xr-back': `${10}px`,
    transform: ` scale(${scale * magnification})`,
  }

  const onSpatialMagnify = (evt: SpatialMagnifyEvent) => {
    console.log('magnify move', evt.detail.magnification)
    setMagnification(evt.detail.magnification)
  }

  const onSpatialMagnifyEnd = () => {
    console.log('magnify end')
    setScale(scale * magnification)
    setMagnification(1)
  }

  const onSpatialMagnifyModel = (evt: ModelSpatialMagnifyEvent) => {
    console.log('magnify move', evt.detail.magnification)
    setMagnification(evt.detail.magnification)
  }

  const onSpatialMagnifyEndModel = () => {
    setScale(scale * magnification)
    setMagnification(1)
  }

  const src =
    'https://utzmqao3qthjebc2.public.blob.vercel-storage.com/saeukkang.usdz'

  return (
    <div>
      <Model
        src={src}
        enable-xr
        style={style}
        onLoad={e => {
          console.log('dbg model onload')
        }}
        onSpatialMagnify={onSpatialMagnifyModel}
        onSpatialMagnifyEnd={onSpatialMagnifyEndModel}
      />
      <div
        enable-xr
        className="red"
        onSpatialMagnify={onSpatialMagnify}
        onSpatialMagnifyEnd={onSpatialMagnifyEnd}
        style={style}
        onSpatialTap={() => {
          console.log('dbg div tap')
        }}
      >
        hello wolrd
      </div>

      <button
        style={{
          width: '200px',
          height: '100px',
          background: 'yellow',
          fontSize: '30px',
        }}
        onClick={() => {
          setMagnification(1)
          setScale(1)
        }}
      >
        reset
      </button>
    </div>
  )
}

export default App
