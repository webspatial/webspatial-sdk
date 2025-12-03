import React, { useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Reality,
  SceneGraph,
  Entity,
  BoxEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

function App() {
  const [logs, setLogs] = useState<string>('')
  const [enabled, setEnabled] = useState<boolean>(true)
  const [matId, setMatId] = useState<'mat' | 'mat2'>('mat')
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0, z: 0 })
  const [boxRot, setBoxRot] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  })
  const [boxScale, setBoxScale] = useState({ x: 1, y: 1, z: 1 })

  const dragBaseRef = useRef(boxPos)
  const scaleBaseRef = useRef(boxScale)

  function logLine(...args: any[]) {
    const msg = args
      .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ')
    setLogs(prev => (prev ? prev + '\n' : '') + msg)
  }

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">Spatial Gestures Demo</h1>
      <div className="flex gap-2 my-3">
        <button className={btnCls} onClick={() => setEnabled(e => !e)}>
          {enabled ? 'Disable' : 'Enable'} Gestures
        </button>
        <button className={btnCls} onClick={() => setLogs('')}>
          Clear Log
        </button>
      </div>
      <Reality
        style={{
          width: '800px',
          height: '500px',
          '--xr-depth': 150,
          '--xr-back': 100,
        }}
        onSpatialTap={e => {
          if (!enabled) return
          logLine('tap', e.detail.location3D)
          setMatId(prev => (prev === 'mat' ? 'mat2' : 'mat'))
        }}
        onSpatialDragStart={e => {
          if (!enabled) return
          logLine('dragStart', e.detail.translation3D)
          dragBaseRef.current = boxPos
        }}
        onSpatialDrag={e => {
          if (!enabled) return
          const t = e.detail.translation3D
          const TRANSLATION_SCALE = 0.001
          const nx = dragBaseRef.current.x + t.x * TRANSLATION_SCALE
          const ny = dragBaseRef.current.y + t.y * TRANSLATION_SCALE
          const nz = dragBaseRef.current.z + t.z * TRANSLATION_SCALE

          const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v))
          setBoxPos({ x: clamp(nx), y: clamp(ny), z: clamp(nz) })
          logLine('drag', t)
        }}
        onSpatialDragEnd={e =>
          enabled && logLine('dragEnd', e.detail.translation3D)
        }
        onSpatialRotateStart={e => enabled && logLine('rotateStart')}
        onSpatialRotate={e => {
          if (!enabled) return
          logLine('rotate tbd')
        }}
        onSpatialRotateEnd={e => enabled && logLine('rotateEnd')}
        onSpatialMagnifyStart={e => {
          if (!enabled) return
          scaleBaseRef.current = boxScale
          logLine('magnifyStart')
        }}
        onSpatialMagnify={e => {
          if (!enabled) return
          const f = e.detail.magnification
          setBoxScale({
            x: scaleBaseRef.current.x * f,
            y: scaleBaseRef.current.y * f,
            z: scaleBaseRef.current.z * f,
          })
          logLine('magnify', f)
        }}
        onSpatialMagnifyEnd={e => enabled && logLine('magnifyEnd')}
      >
        <UnlitMaterial id="mat" color="#3399ff" />
        <UnlitMaterial id="mat2" color="#ff9933" />
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <BoxEntity
              width={0.18}
              height={0.18}
              depth={0.18}
              position={boxPos}
              rotation={boxRot}
              scale={boxScale}
              materials={[matId]}
              onSpatialTap={e => {
                if (!enabled) return
                setMatId(prev => (prev === 'mat' ? 'mat2' : 'mat'))
                logLine('box tap', e.detail.location3D)
              }}
            />
          </Entity>
        </SceneGraph>
      </Reality>

      <div className="mt-6">
        <div className="text-gray-700">Console</div>
        <pre style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>{logs}</pre>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
