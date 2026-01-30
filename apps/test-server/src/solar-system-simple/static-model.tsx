import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Model,
  enableDebugTool,
  ModelRef,
} from '@webspatial/react-sdk'

enableDebugTool()

function StaticModelDemo() {
  const [modelScale, setModelScale] = useState(1)
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 })
  const [showInfo, setShowInfo] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [exclusive, setExclusive] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, z: 0 })
  const modelRef = React.useRef<ModelRef>(null)
  const dragBaseRef = React.useRef(dragOffset)
  const rotateBaseRef = React.useRef(modelRotation)
  const scaleBaseRef = React.useRef(modelScale)
  const activeGestureRef = React.useRef<null | 'drag' | 'rotate' | 'magnify'>(null)
  const planets = [
    { name: 'Sun', src: '/public/modelasset/sun.usdz' },
    { name: 'Mercury', src: '/public/modelasset/mercury.usdz' },
    { name: 'Venus', src: '/public/modelasset/venus.usdz' },
    { name: 'Earth', src: '/public/modelasset/earth.usdz' },
    { name: 'Mars', src: '/public/modelasset/mars.usdz' },
    { name: 'Jupiter', src: '/public/modelasset/jupiter.usdz' },
    { name: 'Saturn', src: '/public/modelasset/saturn.usdz' },
    { name: 'Uranus', src: '/public/modelasset/uranus.usdz' },
    { name: 'Neptune', src: '/public/modelasset/neptune.usdz' },
    { name: 'Pluto', src: '/public/modelasset/pluto.usdz' },
  ]
  const [planetIndex, setPlanetIndex] = useState(3)

  // React.useEffect(() => {
  //   const t = modelRef.current?.entityTransform
  //   if (!t) return
  //   t.m41 = dragOffset.x
  //   t.m42 = dragOffset.y
  //   t.m43 = dragOffset.z
  // }, [dragOffset])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setEnabled(e => !e)}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: enabled ? '#42a5f5' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {enabled ? 'Disable Gestures' : 'Enable Gestures'}
          </button>
          <button
            onClick={() => setExclusive(e => !e)}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: exclusive ? '#42a5f5' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {exclusive ? 'Exclusive Mode' : 'Simultaneous Mode'}
          </button>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {planets.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setPlanetIndex(i)}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: i === planetIndex ? '#42a5f5' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setShowInfo(s => !s)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: showInfo ? '#42a5f5' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Info
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', height: '360px' }}>
        <Model
          enable-xr
          ref={modelRef}
          src={planets[planetIndex].src}
          style={{
            width: '340px',
            height: '340px',
            margin: '0 auto',
            display: 'block',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            background: 'rgba(0,0,0,0.3)'
          }}
          onSpatialTap={() => {
            if (!enabled) return
            setShowInfo(s => !s)
          }}
          onSpatialDragStart={() => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'drag') return
            activeGestureRef.current = 'drag'
            dragBaseRef.current = { x: 0, y: 0, z: 0 }
          }}
          onSpatialDrag={(e) => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'drag') return
            const t = e.detail.translation3D
            const dx = t.x - dragBaseRef.current.x
            const dy = t.y - dragBaseRef.current.y
            const dz = t.z - dragBaseRef.current.z
            const mat = modelRef.current?.entityTransform
            if (mat) {
              mat.translateSelf(dx, dy, dz)
            }
            dragBaseRef.current = t
          }}
          onSpatialDragEnd={() => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'drag') return
            if (exclusive) activeGestureRef.current = null
          }}
          onSpatialRotateStart={() => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'rotate') return
            activeGestureRef.current = 'rotate'
            rotateBaseRef.current = modelRotation
          }}
          onSpatialRotate={(e) => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'rotate') return
            const [x, y, z, w] = e.detail.rotation.vector
            const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))
            const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (w * y - z * x))))
            const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
            const toDeg = (r: number) => (r * 180) / Math.PI
            const rollDeg = toDeg(roll)
            const pitchDeg = toDeg(pitch)
            const yawDeg = toDeg(yaw)
            setModelRotation({
              x: rotateBaseRef.current.x + rollDeg,
              y: rotateBaseRef.current.y + pitchDeg,
              z: rotateBaseRef.current.z + yawDeg,
            })
          }}
          onSpatialRotateEnd={() => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'rotate') return
            if (exclusive) activeGestureRef.current = null
          }}
          onSpatialMagnifyStart={() => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'magnify') return
            activeGestureRef.current = 'magnify'
            scaleBaseRef.current = modelScale
          }}
          onSpatialMagnify={(e) => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'magnify') return
            const m = Math.max(0.3, Math.min(3, e.detail.magnification))
            setModelScale(scaleBaseRef.current * m)
          }}
          onSpatialMagnifyEnd={() => {
            if (!enabled) return
            if (exclusive && activeGestureRef.current && activeGestureRef.current !== 'magnify') return
            if (exclusive) activeGestureRef.current = null
          }}
        />

        {showInfo && (
          <div
            enable-xr
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '300px',
              minHeight: '130px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
              transform: `translate3d(210px, -130px, 0px)`,
              '--xr-back': 120,
              '--xr-depth': 100,
              color: '#fff',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              transition: 'transform 0.2s ease',
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#42a5f5',
              flex: '0 0 auto',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{planets[planetIndex].name}</div>
              <div style={{ fontSize: '12px', opacity: 0.85 }}>Labeled 3D model with XR info panel</div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                {/* <div>Tap to rotate • Drag to manipulate • Pinch to scale</div> */}
                <div>Assets from public/modelasset</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', color: '#ccc' }}>
        <p>🛸 Interactive 3D Model</p>
        <p style={{ marginTop: '0.5rem' }}>Selected: {planets[planetIndex].name}</p>
      </div>
    </div>
  )
}

// Mount the app
const root = document.getElementById('demo-root')
if (root) {
  ReactDOM.createRoot(root).render(<StaticModelDemo />)
}
