import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  AttachmentAsset,
  AttachmentEntity,
  BoxEntity,
  CylinderEntity,
  enableDebugTool,
  Entity,
  Reality,
  SceneGraph,
  SphereEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

enableDebugTool()

function App() {
  // Shared state: clicking the 2D button OR the 3D attachment both update this
  const [count, setCount] = useState(0)

  const [showAttachments, setShowAttachments] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [groupPosition, setGroupPosition] = useState({ x: 0, y: 0, z: 0 })
  const [groupRotation, setGroupRotation] = useState({ x: 0, y: 0, z: 0 })
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (animating) {
      startTimeRef.current = performance.now()
      const animate = () => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000
        setGroupPosition({
          x: Math.sin(elapsed) * 0.15,
          y: Math.sin(elapsed * 1.5) * 0.05,
          z: 0,
        })
        setGroupRotation({
          x: 0,
          y: elapsed * 0.5,
          z: Math.sin(elapsed * 0.7) * 0.3,
        })
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      setGroupPosition({ x: 0, y: 0, z: 0 })
      setGroupRotation({ x: 0, y: 0, z: 0 })
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [animating])

  const btnCls =
    'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

  return (
    <div className="pl-5 pt-2">
      <h1 style={{ '--xr-back': 100 } as any} className="text-2xl text-black">
        Attachment Test
      </h1>

      <div className="flex gap-3 mt-4">
        <button className={btnCls} onClick={() => setCount(c => c + 1)}>
          Count: {count} (2D button)
        </button>

        <button
          className={btnCls}
          onClick={() => setShowAttachments(prev => !prev)}
        >
          {showAttachments ? 'Hide' : 'Show'} Attachments
        </button>

        <button
          className={btnCls}
          onClick={() => setAnimating(prev => !prev)}
        >
          {animating ? 'Stop' : 'Start'} Animation
        </button>
      </div>

      <div>
        <Reality
          style={{
            width: '600px',
            height: '600px',
            '--xr-depth': 100,
            '--xr-back': 200,
          }}
        >
          <UnlitMaterial
            id="matRed"
            color="#ff0000"
            transparent={true}
            opacity={0.5}
          />
          <UnlitMaterial
            id="matGreen"
            color="#00ff00"
            transparent={true}
            opacity={0.5}
          />
          <UnlitMaterial
            id="matBlue"
            color="#0000ff"
            transparent={true}
            opacity={0.5}
          />

          {/* Attachment content shares React state with the main page */}
          <AttachmentAsset name="counter-label">
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 12,
                padding: 8,
              }}
            >
              <p
                style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                Count: {count}
              </p>
              <button
                onClick={() => setCount(c => c + 1)}
                style={{
                  marginTop: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#4488ff',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                +1 (3D button)
              </button>
            </div>
          </AttachmentAsset>

          <AttachmentAsset name="sphere-label">
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 12,
              }}
            >
              <p style={{ color: '#66ff66', fontSize: 14, margin: 0 }}>
                Sphere
              </p>
            </div>
          </AttachmentAsset>

          <AttachmentAsset name="cylinder-label">
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 12,
              }}
            >
              <p style={{ color: '#6666ff', fontSize: 14, margin: 0 }}>
                Cylinder
              </p>
            </div>
          </AttachmentAsset>

          <SceneGraph>
            <Entity position={groupPosition} rotation={groupRotation}>
              {/* Box with shared-state counter attachment */}
              <Entity position={{ x: -0.2, y: 0, z: 0 }}>
                <BoxEntity
                  width={0.1}
                  height={0.1}
                  depth={0.1}
                  materials={['matRed']}
                />
                {showAttachments && (
                  <AttachmentEntity
                    attachment="counter-label"
                    position={[0, 0.15, 0]}
                    size={{ width: 160, height: 80 }}
                  />
                )}
              </Entity>

              <Entity position={{ x: 0, y: 0, z: 0 }}>
                <SphereEntity radius={0.05} materials={['matGreen']} />
                {showAttachments && (
                  <AttachmentEntity
                    attachment="sphere-label"
                    position={[0, 0.1, 0]}
                    size={{ width: 100, height: 40 }}
                  />
                )}
              </Entity>

              <Entity position={{ x: 0.2, y: 0, z: 0 }}>
                <CylinderEntity
                  radius={0.05}
                  height={0.1}
                  materials={['matBlue']}
                />
                {showAttachments && (
                  <AttachmentEntity
                    attachment="cylinder-label"
                    position={[0, 0.12, 0]}
                    size={{ width: 100, height: 40 }}
                  />
                )}
              </Entity>
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}

export default App
