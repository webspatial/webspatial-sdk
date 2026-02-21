import React, { useEffect, useRef, useState } from 'react'
import {
  Reality,
  SceneGraph,
  Entity,
  BoxEntity,
  PlaneEntity,
  SphereEntity,
  ConeEntity,
  CylinderEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

export default function RealityDynamic3D() {
  const [boxPos, setBoxPos] = useState({ x: -0.22, y: 0.12, z: 0 })
  const [planePos, setPlanePos] = useState({ x: 0.22, y: -0.12, z: 0 })
  const [spherePos, setSpherePos] = useState({ x: 0.22, y: 0.12, z: 0 })
  const [conePos, setConePos] = useState({ x: -0.22, y: -0.12, z: 0 })
  const [cylinderPos, setCylinderPos] = useState({ x: 0, y: -0.12, z: 0 })

  const [boxRot, setBoxRot] = useState({ x: 0, y: 0, z: 0 })
  const [planeRot, setPlaneRot] = useState({ x: 0, y: 0, z: 0 })
  const [sphereRot, setSphereRot] = useState({ x: 0, y: 0, z: 0 })
  const [coneRot, setConeRot] = useState({ x: 0, y: 0, z: 0 })
  const [cylinderRot, setCylinderRot] = useState({ x: 0, y: 0, z: 0 })

  const [boxSpin, setBoxSpin] = useState(false)
  const [planeSpin, setPlaneSpin] = useState(false)
  const [sphereSpin, setSphereSpin] = useState(false)
  const [coneSpin, setConeSpin] = useState(false)
  const [cylinderSpin, setCylinderSpin] = useState(false)

  const boxAnimRef = useRef<number | null>(null)
  const planeAnimRef = useRef<number | null>(null)
  const sphereAnimRef = useRef<number | null>(null)
  const coneAnimRef = useRef<number | null>(null)
  const cylinderAnimRef = useRef<number | null>(null)

  useEffect(() => {
    if (boxSpin) {
      function step() {
        setBoxRot(prev => ({ ...prev, z: prev.z + 0.05 }))
        boxAnimRef.current = requestAnimationFrame(step)
      }
      step()
    } else if (boxAnimRef.current) {
      cancelAnimationFrame(boxAnimRef.current)
      boxAnimRef.current = null
    }
  }, [boxSpin])

  useEffect(() => {
    if (planeSpin) {
      function step() {
        setPlaneRot(prev => ({ ...prev, z: prev.z + 0.05 }))
        planeAnimRef.current = requestAnimationFrame(step)
      }
      step()
    } else if (planeAnimRef.current) {
      cancelAnimationFrame(planeAnimRef.current)
      planeAnimRef.current = null
    }
  }, [planeSpin])

  useEffect(() => {
    if (sphereSpin) {
      function step() {
        setSphereRot(prev => ({ ...prev, z: prev.z + 0.05 }))
        sphereAnimRef.current = requestAnimationFrame(step)
      }
      step()
    } else if (sphereAnimRef.current) {
      cancelAnimationFrame(sphereAnimRef.current)
      sphereAnimRef.current = null
    }
  }, [sphereSpin])

  useEffect(() => {
    if (coneSpin) {
      function step() {
        setConeRot(prev => ({ ...prev, z: prev.z + 0.05 }))
        coneAnimRef.current = requestAnimationFrame(step)
      }
      step()
    } else if (coneAnimRef.current) {
      cancelAnimationFrame(coneAnimRef.current)
      coneAnimRef.current = null
    }
  }, [coneSpin])

  useEffect(() => {
    if (cylinderSpin) {
      function step() {
        setCylinderRot(prev => ({ ...prev, z: prev.z + 0.05 }))
        cylinderAnimRef.current = requestAnimationFrame(step)
      }
      step()
    } else if (cylinderAnimRef.current) {
      cancelAnimationFrame(cylinderAnimRef.current)
      cylinderAnimRef.current = null
    }
  }, [cylinderSpin])

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-4">Dynamic 3D Geometry Demo</h1>
      <div className="flex flex-wrap gap-2 my-6 bg-[#1A1A1A] p-4 rounded-xl border border-gray-800">
        <button
          className={btnCls}
          onClick={() =>
            setBoxPos(p => ({ ...p, y: p.y === 0.12 ? 0.14 : 0.12 }))
          }
        >
          Toggle Box Pos
        </button>
        <button className={btnCls} onClick={() => setBoxSpin(s => !s)}>
          Toggle Box Rot
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setPlanePos(p => ({ ...p, y: p.y === -0.12 ? -0.14 : -0.12 }))
          }
        >
          Toggle Plane Pos
        </button>
        <button className={btnCls} onClick={() => setPlaneSpin(s => !s)}>
          Toggle Plane Rot
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setSpherePos(p => ({ ...p, y: p.y === 0.12 ? 0.14 : 0.12 }))
          }
        >
          Toggle Sphere Pos
        </button>
        <button className={btnCls} onClick={() => setSphereSpin(s => !s)}>
          Toggle Sphere Rot
        </button>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          style={{
            width: '100%',
            height: '600px',
            '--xr-depth': 150,
            '--xr-back': 100,
          }}
        >
          <UnlitMaterial id="matRed" color="#ff0000" />
          <UnlitMaterial id="matGreen" color="#00ff00" />
          <UnlitMaterial id="matBlue" color="#0000ff" />
          <UnlitMaterial id="matOrange" color="#ff8800" />
          <UnlitMaterial id="matPurple" color="#9900ff" />

          <SceneGraph>
            <Entity
              position={{ x: 0, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 0.5, y: 0.5, z: 0.5 }}
            >
              <BoxEntity
                width={0.18}
                height={0.18}
                depth={0.12}
                materials={['matRed']}
                position={boxPos}
                rotation={boxRot}
              />
              <PlaneEntity
                width={0.18}
                height={0.12}
                materials={['matGreen']}
                position={planePos}
                rotation={planeRot}
              />
              <SphereEntity
                radius={0.08}
                materials={['matBlue']}
                position={spherePos}
                rotation={sphereRot}
              />
              <ConeEntity
                radius={0.08}
                height={0.12}
                materials={['matOrange']}
                position={conePos}
                rotation={coneRot}
              />
              <CylinderEntity
                radius={0.08}
                height={0.12}
                materials={['matPurple']}
                position={cylinderPos}
                rotation={cylinderRot}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}
