// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react'
import {
  Reality,
  SceneGraph,
  Entity,
  BoxEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all'

export default function RealityGestures() {
  const [logs, setLogs] = useState<string>('')
  const [enabled, setEnabled] = useState<boolean>(true)
  const [exclusive, setExclusive] = useState<boolean>(false)
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

  useEffect(() => {
    const el = logRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [logs])

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-4">Spatial Gestures Demo</h1>
      <div className="flex flex-wrap gap-2 my-6 bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
        <button className={btnCls} onClick={() => setEnabled(e => !e)}>
          {enabled ? 'Disable' : 'Enable'} Gestures
        </button>
        <button className={btnCls} onClick={() => setExclusive(e => !e)}>
          {exclusive ? 'Exclusive' : 'Simultaneous'} Mode
        </button>
        <button className={btnCls} onClick={() => setLogs('')}>
          Clear Log
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
          <Reality
            style={{
              width: '100%',
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
                  width={0.2}
                  height={0.2}
                  depth={0.1}
                  cornerRadius={0.5}
                  position={boxPos}
                  rotation={boxRot}
                  scale={boxScale}
                  materials={['matGreen']}
                  onSpatialTap={async e => {
                    if (!enabled) return
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
                    const clamp = (v: number) =>
                      Math.max(-0.5, Math.min(0.5, v))
                    setBoxPos({ x: clamp(nx), y: clamp(ny), z: clamp(nz) })
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
                    logLine('dragEnd', e.detail.translation3D)
                  }}
                  onSpatialRotateStart={e => {
                    if (!enabled) return
                    if (
                      exclusive &&
                      activeGestureRef.current &&
                      activeGestureRef.current !== 'rotate'
                    )
                      return
                    activeGestureRef.current = 'rotate'
                    rotateBaseRef.current = boxRot
                    logLine('rotateStart')
                  }}
                  onSpatialRotate={e => {
                    if (!enabled) return
                    if (
                      exclusive &&
                      activeGestureRef.current &&
                      activeGestureRef.current !== 'rotate'
                    )
                      return
                    const [x, y, z, w] = e.detail.rotation.vector
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
                    setBoxRot({
                      x: rotateBaseRef.current.x + toDeg(roll),
                      y: rotateBaseRef.current.y + toDeg(pitch),
                      z: rotateBaseRef.current.z + toDeg(yaw),
                    })
                    logLine('rotate', {
                      roll: toDeg(roll),
                      pitch: toDeg(pitch),
                      yaw: toDeg(yaw),
                    })
                  }}
                  onSpatialRotateEnd={e => {
                    if (!enabled) return
                    if (
                      exclusive &&
                      activeGestureRef.current &&
                      activeGestureRef.current !== 'rotate'
                    )
                      return
                    if (exclusive) activeGestureRef.current = null
                    logLine('rotateEnd')
                  }}
                  onSpatialMagnifyStart={e => {
                    if (!enabled) return
                    if (
                      exclusive &&
                      activeGestureRef.current &&
                      activeGestureRef.current !== 'magnify'
                    )
                      return
                    activeGestureRef.current = 'magnify'
                    scaleBaseRef.current = boxScale
                    logLine('magnifyStart', {
                      magnification: e.detail.magnification,
                    })
                  }}
                  onSpatialMagnify={e => {
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
                    if (!enabled) return
                    if (
                      exclusive &&
                      activeGestureRef.current &&
                      activeGestureRef.current !== 'magnify'
                    )
                      return
                    if (exclusive) activeGestureRef.current = null
                    logLine('magnifyEnd')
                  }}
                />
              </Entity>
            </SceneGraph>
          </Reality>
        </div>

        <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 flex flex-col h-[500px]">
          <div className="text-gray-400 font-bold mb-2">Gesture Log</div>
          <pre
            ref={logRef}
            className="flex-1 overflow-y-auto text-xs font-mono bg-black/40 p-4 rounded-lg"
          >
            {logs}
          </pre>
        </div>
      </div>
    </div>
  )
}
