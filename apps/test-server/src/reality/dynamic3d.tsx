import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
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

function App() {
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
    return () => {}
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
    return () => {}
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
    return () => {}
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
    return () => {}
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
    return () => {}
  }, [cylinderSpin])

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">Dynamic 3D Geometry Demo</h1>
      <div className="flex flex-wrap gap-2 my-3">
        <button
          className={btnCls}
          onClick={() =>
            setBoxPos(p => ({ ...p, y: p.y === 0.12 ? 0.14 : 0.12 }))
          }
        >
          Toggle Box Position
        </button>
        <button className={btnCls} onClick={() => setBoxSpin(s => !s)}>
          Toggle Box Rotation
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setPlanePos(p => ({ ...p, y: p.y === -0.12 ? -0.14 : -0.12 }))
          }
        >
          Toggle Plane Position
        </button>
        <button className={btnCls} onClick={() => setPlaneSpin(s => !s)}>
          Toggle Plane Rotation
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setSpherePos(p => ({ ...p, y: p.y === 0.12 ? 0.14 : 0.12 }))
          }
        >
          Toggle Sphere Position
        </button>
        <button className={btnCls} onClick={() => setSphereSpin(s => !s)}>
          Toggle Sphere Rotation
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setConePos(p => ({ ...p, y: p.y === -0.12 ? -0.14 : -0.12 }))
          }
        >
          Toggle Cone Position
        </button>
        <button className={btnCls} onClick={() => setConeSpin(s => !s)}>
          Toggle Cone Rotation
        </button>
        <button
          className={btnCls}
          onClick={() =>
            setCylinderPos(p => ({ ...p, y: p.y === -0.12 ? -0.14 : -0.12 }))
          }
        >
          Toggle Cylinder Position
        </button>
        <button className={btnCls} onClick={() => setCylinderSpin(s => !s)}>
          Toggle Cylinder Rotation
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
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(<App />)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
