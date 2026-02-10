import { useRef, useState } from 'react'
import './index.css'
import {
  enableDebugTool,
  SpatialDragStartEvent,
  SpatialDragEvent,
  Model,
  ModelSpatialDragEvent,
  ModelSpatialDragStartEvent,
  ModelSpatialDragEndEvent,
} from '@webspatial/react-sdk'
import ReactDOM from 'react-dom/client'

enableDebugTool()

function App() {
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [tz, setTz] = useState(0)
  const lastTranslation = useRef({ x: 0, y: 0, z: 0 })

  const style = {
    width: '300px',
    height: '300px',
    '--xr-back': `${10}px`,
    transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`,
  }

  const onSpatialDragStart = (evt: SpatialDragStartEvent) => {
    console.log('drag start', evt.detail.startLocation3D)
  }

  const spatialDrag = (evt: SpatialDragEvent | ModelSpatialDragEvent) => {
    console.log(
      'drag move',
      evt.detail.translation3D.x,
      evt.detail.translation3D.y,
      evt.detail.translation3D.z,
    )
    const deltaX = evt.detail.translation3D.x - lastTranslation.current.x
    lastTranslation.current.x = evt.detail.translation3D.x
    const deltaY = evt.detail.translation3D.y - lastTranslation.current.y
    lastTranslation.current.y = evt.detail.translation3D.y
    const deltaZ = evt.detail.translation3D.z - lastTranslation.current.z
    lastTranslation.current.z = evt.detail.translation3D.z

    setTx(prevTx => prevTx + deltaX)
    setTy(prevTy => prevTy + deltaY)
    setTz(prevTz => prevTz + deltaZ)

    console.log('evt.detail.translation3D', evt.detail.translation3D)
  }

  const spatialDragEnd = () => {
    lastTranslation.current = { x: 0, y: 0, z: 0 }
  }

  const onSpatialDrag = (evt: SpatialDragEvent) => {
    spatialDrag(evt)
  }

  const onSpatialDragEnd = () => {
    spatialDragEnd()
  }

  const onModelSpatialDragStart = (evt: ModelSpatialDragStartEvent) => {
    console.log('model drag start', evt.detail.startLocation3D)
  }

  const onModelSpatialDrag = (evt: ModelSpatialDragEvent) => {
    spatialDrag(evt)
  }

  const onModelSpatialDragEnd = (evt: ModelSpatialDragEndEvent) => {
    spatialDragEnd()
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
        onSpatialDragStart={onModelSpatialDragStart}
        onSpatialDrag={onModelSpatialDrag}
        onSpatialDragEnd={onModelSpatialDragEnd}
        onSpatialTap={() => {
          console.log('dbg model tap')
        }}
      />
      <div
        enable-xr
        className="red"
        onSpatialDragStart={onSpatialDragStart}
        onSpatialDrag={onSpatialDrag}
        onSpatialDragEnd={onSpatialDragEnd}
        style={style}
        onClick={() => {
          console.log('dbg onClick')
        }}
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
          setTx(0)
          setTy(0)
          setTz(0)
        }}
      >
        reset
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
