import React, { useRef, useState, useEffect } from 'react'
import {
  Reality,
  SceneGraph,
  Entity,
  Box,
  Plane,
  Sphere,
  Cone,
  Cylinder,
  Material,
  enableDebugTool,
} from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

enableDebugTool()

export default function RealityAliases() {
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!spinning) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      animRef.current = null
      return
    }
    const step = () => {
      setRot(prev => prev + 0.03)
      animRef.current = requestAnimationFrame(step)
    }
    step()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [spinning])

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Aliases & Material Demo</h1>
      <p className="text-gray-400 mb-4">
        simplified aliases（Box/Plane/Sphere/Cone/Cylinder）and Material。
      </p>

      <div className="flex gap-2 mb-6">
        <button className={btnCls} onClick={() => setSpinning(s => !s)}>
          {spinning ? 'stop spinning' : 'start spinning'}
        </button>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          style={{
            width: '100%',
            height: '600px',
            '--xr-depth': 120,
            '--xr-back': 120,
          }}
        >
          <Material type="unlit" id="matRed" color="#ff3b30" />
          <Material type="unlit" id="matGreen" color="#34c759" />
          <Material type="unlit" id="matBlue" color="#0a84ff" />
          <Material type="unlit" id="matOrange" color="#ff9f0a" />
          <Material type="unlit" id="matPurple" color="#bf5af2" />

          <SceneGraph>
            <Entity
              position={{ x: 0, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 0.6, y: 0.6, z: 0.6 }}
            >
              <Box
                width={0.18}
                height={0.18}
                depth={0.12}
                materials={['matRed']}
                position={{ x: -0.22, y: 0.12, z: 0 }}
                rotation={{ x: 0, y: 0, z: rot }}
              />
              <Plane
                width={0.18}
                height={0.12}
                cornerRadius={0.01}
                materials={['matGreen']}
                position={{ x: 0.22, y: -0.12, z: 0 }}
                rotation={{ x: 0, y: 0, z: -rot }}
              />
              <Sphere
                radius={0.08}
                materials={['matBlue']}
                position={{ x: 0.22, y: 0.12, z: 0 }}
                rotation={{ x: 0, y: 0, z: rot }}
              />
              <Cone
                radius={0.08}
                height={0.12}
                materials={['matOrange']}
                position={{ x: -0.22, y: -0.12, z: 0 }}
                rotation={{ x: 0, y: 0, z: -rot }}
              />
              <Cylinder
                radius={0.08}
                height={0.12}
                materials={['matPurple']}
                position={{ x: 0, y: -0.12, z: 0 }}
                rotation={{ x: 0, y: 0, z: rot }}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}
