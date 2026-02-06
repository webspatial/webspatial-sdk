import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  const [exclusive, setExclusive] = useState<boolean>(false)
  const [matId, setMatId] = useState<'matGreen'>('matGreen')
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0, z: 0 })
  const [boxRot, setBoxRot] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  })
  const [boxScale, setBoxScale] = useState({ x: 1, y: 1, z: 1 })

  const dragBaseRef = useRef(boxPos)
  const scaleBaseRef = useRef(boxScale)
  const rotateBaseRef = useRef(boxRot)
  const activeGestureRef = useRef<null | 'drag' | 'rotate' | 'magnify'>(null)
  const logRef = useRef<HTMLPreElement>(null)

  function logLine(...args: any[]) {
    const msg = args
      .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ')
    setLogs(prev => (prev ? prev + '\n' : '') + msg)
  }

  const allowed = 'rotate'

  const isAllow = (type: 'drag' | 'scale' | 'rotate') => {
    return true
    return type === allowed
  }

  useEffect(() => {
    const el = logRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [logs])

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">Spatial Gestures Demos</h1>
      <div className="flex gap-2 my-3">
        <button className={btnCls} onClick={() => setEnabled(e => !e)}>
          {enabled ? 'Disable' : 'Enable'} Gestures
        </button>
        <button className={btnCls} onClick={() => setExclusive(e => !e)}>
          {exclusive ? 'Exclusive' : 'Simultaneous'} Mode
        </button>
        <button className={btnCls} onClick={() => setLogs('')}>
          Clear Log
        </button>
        <button
          className={btnCls}
          onClick={() => {
            location.reload()
          }}
        >
          reload
        </button>
      </div>
      <Reality
        style={{
          width: '800px',
          height: '500px',
          '--xr-depth': 150,
          '--xr-back': 100,
        }}
      >
        <UnlitMaterial id="matGreen" color="#22cc66" />
        <SceneGraph>
          <Entity position={{ x: 0, y: 0, z: 0 }}>
            <BoxEntity
              id="boxGreen"
              key={matId}
              width={0.2}
              height={0.2}
              depth={0.1}
              cornerRadius={0.5}
              position={boxPos}
              rotation={boxRot}
              scale={boxScale}
              materials={[matId]}
              onSpatialTap={async e => {
                if (!enabled) return
                console.log('tap box', e.detail.location3D)
                logLine('tap box', e.detail.location3D)
              }}
              onSpatialDragStart={async e => {
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'drag'
                )
                  return
                activeGestureRef.current = 'drag'
                dragBaseRef.current = boxPos
                console.log('dragStart', e.detail.translation3D)
                logLine('dragStart', e.detail.translation3D)
              }}
              onSpatialDrag={async e => {
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'drag'
                )
                  return
                const t = e.detail.translation3D
                const TRANSLATION_SCALE = 0.001
                const nx = dragBaseRef.current.x + t.x * TRANSLATION_SCALE
                const ny = dragBaseRef.current.y - t.y * TRANSLATION_SCALE
                const nz = dragBaseRef.current.z + t.z * TRANSLATION_SCALE
                const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v))
                setBoxPos({ x: clamp(nx), y: clamp(ny), z: clamp(nz) })
                console.log('drag', t)
                logLine('drag', t)
              }}
              onSpatialDragEnd={async e => {
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'drag'
                )
                  return
                if (exclusive) activeGestureRef.current = null
                console.log('dragEnd', e.detail.translation3D)
                logLine('dragEnd', e.detail.translation3D)
              }}
              onSpatialRotate={e => {
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'rotate'
                )
                  return
                console.log('quaternion', e.detail.quaternion)
                const { x, y, z, w } = e.detail.quaternion
                const roll = Math.atan2(
                  2 * (w * x + y * z),
                  1 - 2 * (x * x + y * y),
                )
                const pitch = Math.asin(
                  Math.max(-1, Math.min(1, 2 * (w * y - z * x))),
                )
                const yaw = Math.atan2(
                  2 * (w * z + x * y),
                  1 - 2 * (y * y + z * z),
                )
                const toDeg = (r: number) => (r * 180) / Math.PI
                const rollDeg = toDeg(roll)
                const pitchDeg = toDeg(pitch)
                const yawDeg = toDeg(yaw)
                setBoxRot({
                  x: rotateBaseRef.current.x + rollDeg,
                  y: rotateBaseRef.current.y + pitchDeg,
                  z: rotateBaseRef.current.z + yawDeg,
                })
                console.log('rotate', e.detail.quaternion, {
                  rollDeg,
                  pitchDeg,
                  yawDeg,
                })
                logLine('rotate', { rollDeg, pitchDeg, yawDeg })
              }}
              onSpatialRotateEnd={e => {
                if (!isAllow('rotate')) return
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'rotate'
                )
                  return
                if (exclusive) activeGestureRef.current = null
                console.log('rotateEnd')
                logLine('rotateEnd')
              }}
              onSpatialMagnify={(e: any) => {
                if (!isAllow('scale')) return
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'magnify'
                )
                  return
                const m = Math.max(0.3, Math.min(3, e.detail.magnification))
                setBoxScale({
                  x: scaleBaseRef.current.x * m,
                  y: scaleBaseRef.current.y * m,
                  z: scaleBaseRef.current.z * m,
                })
                logLine('magnify', {
                  magnification: e.detail.magnification,
                  clamped: m,
                })
              }}
              onSpatialMagnifyEnd={e => {
                if (!isAllow('scale')) return
                if (!enabled) return
                if (
                  exclusive &&
                  activeGestureRef.current &&
                  activeGestureRef.current !== 'magnify'
                )
                  return
                if (exclusive) activeGestureRef.current = null
                logLine('magnifyEnd', {
                  magnification: e.detail.magnification,
                })
              }}
            />
          </Entity>
        </SceneGraph>
      </Reality>

      <div
        className="mt-6"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: '50vw',
          overflowY: 'hidden',
        }}
      >
        <div className="text-gray-700">Console</div>
        <pre
          ref={logRef}
          style={{
            fontSize: '16px',
            whiteSpace: 'pre-wrap',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {logs}
        </pre>
      </div>
    </div>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
