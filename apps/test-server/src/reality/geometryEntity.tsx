import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BoxEntity,
  ConeEntity,
  enableDebugTool,
  Entity,
  EntityRef,
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  SpatializedElementRef,
  SphereEntity,
  CylinderEntity,
  PlaneEntity,
  UnlitMaterial,
} from '@webspatial/react-sdk'

enableDebugTool()

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

function App() {
  const [logs, setLogs] = useState('')

  useEffect(() => {
    window.onerror = (error: any) => {
      log('error:', error.message)
    }

    return () => {
      window.onerror = null
    }
  }, [])

  function log(...args: any[]) {
    setLogs(pre => {
      let ans = pre + '\n'
      for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === 'object') {
          ans += JSON.stringify(args[i])
        } else {
          ans += args[i]
        }
      }
      return ans
    })
  }

  const [boxPosition, setBoxPosition] = useState({ x: 0, y: 0, z: 0 })
  const [boxRotation, setBoxRotation] = useState({ x: 0, y: 0, z: 0 })
  const [boxRotationOn, setBoxRotationOn] = useState(false)
  const boxAnimationRef = useRef<any>()
  useEffect(() => {
    if (boxRotationOn) {
      function doRotate(delta: number) {
        setBoxRotation({
          x: 0,
          y: 0,
          z: boxRotation.z + 0.1 * delta,
        })
        boxAnimationRef.current = requestAnimationFrame(doRotate)
      }
      doRotate(0)
    } else {
      if (boxAnimationRef.current) {
        cancelAnimationFrame(boxAnimationRef.current)
        boxAnimationRef.current = null
      }
    }

    return () => {}
  }, [boxRotationOn])

  const [planePosition, setPlanePosition] = useState({ x: 0, y: 0.2, z: 0 })
  const [planeRotation, setPlaneRotation] = useState({ x: 0, y: 0, z: 0 })
  const [planeRotationOn, setPlaneRotationOn] = useState(false)
  const planeAnimationRef = useRef<any>()
  useEffect(() => {
    if (planeRotationOn) {
      function doRotate(delta: number) {
        setPlaneRotation({
          x: 0,
          y: 0,
          z: planeRotation.z + 0.1 * delta,
        })
        planeAnimationRef.current = requestAnimationFrame(doRotate)
      }
      doRotate(0)
    } else {
      if (planeAnimationRef.current) {
        cancelAnimationFrame(planeAnimationRef.current)
        planeAnimationRef.current = null
      }
    }

    return () => {}
  }, [planeRotationOn])

  const [spherePosition, setSpherePosition] = useState({ x: 0.2, y: 0, z: 0 })
  const [sphereRotation, setSphereRotation] = useState({ x: 0, y: 0, z: 0 })
  const [sphereRotationOn, setSphereRotationOn] = useState(false)
  const sphereAnimationRef = useRef<any>()
  useEffect(() => {
    if (sphereRotationOn) {
      function doRotate(delta: number) {
        setSphereRotation({
          x: 0,
          y: 0,
          z: sphereRotation.z + 0.1 * delta,
        })
        sphereAnimationRef.current = requestAnimationFrame(doRotate)
      }
      doRotate(0)
    } else {
      if (sphereAnimationRef.current) {
        cancelAnimationFrame(sphereAnimationRef.current)
        sphereAnimationRef.current = null
      }
    }

    return () => {}
  }, [sphereRotationOn])

  const [conePosition, setConePosition] = useState({ x: 0.4, y: 0, z: 0 })
  const [coneRotation, setConeRotation] = useState({ x: 0, y: 0, z: 0 })
  const [coneRotationOn, setConeRotationOn] = useState(false)
  const coneAnimationRef = useRef<any>()
  useEffect(() => {
    if (coneRotationOn) {
      function doRotate(delta: number) {
        setConeRotation({
          x: 0,
          y: 0,
          z: coneRotation.z + 0.1 * delta,
        })
        coneAnimationRef.current = requestAnimationFrame(doRotate)
      }
      doRotate(0)
    } else {
      if (coneAnimationRef.current) {
        cancelAnimationFrame(coneAnimationRef.current)
        coneAnimationRef.current = null
      }
    }

    return () => {}
  }, [coneRotationOn])

  const [cylinderPosition, setCylinderPosition] = useState({
    x: 0.6,
    y: 0,
    z: 0,
  })
  const [cylinderRotation, setCylinderRotation] = useState({ x: 0, y: 0, z: 0 })
  const [cylinderRotationOn, setCylinderRotationOn] = useState(false)
  const cylinderAnimationRef = useRef<any>()
  useEffect(() => {
    if (cylinderRotationOn) {
      function doRotate(delta: number) {
        setCylinderRotation({
          x: 0,
          y: 0,
          z: cylinderRotation.z + 0.1 * delta,
        })
        cylinderAnimationRef.current = requestAnimationFrame(doRotate)
      }
      doRotate(0)
    } else {
      if (cylinderAnimationRef.current) {
        cancelAnimationFrame(cylinderAnimationRef.current)
        cylinderAnimationRef.current = null
      }
    }

    return () => {}
  }, [cylinderRotationOn])

  const entRef = useRef<EntityRef>(null)
  const modelEntRef = useRef<EntityRef>(null)
  const boxEntRef = useRef<EntityRef>(null)

  const realityRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)

  const [showModelEntity, setShowModelEntity] = useState(true)

  return (
    <div className="pl-5 pt-2">
      <h1
        // enable-xr
        style={{ '--xr-back': 100 }}
        className="text-2xl text-black"
      >
        reality test
      </h1>

      <button
        className={btnCls}
        onClick={async () => {
          setBoxPosition(prePos => ({ ...prePos, x: prePos.x === 0 ? 0.1 : 0 }))
        }}
      >
        Toggle Box Position
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          setBoxRotationOn(prev => !prev)
        }}
      >
        Toggle Box Rotation
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          setPlanePosition(prePos => ({
            ...prePos,
            y: prePos.y === 0.2 ? 0 : 0.2,
          }))
        }}
      >
        Toggle Plane Position
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          setPlaneRotationOn(prev => !prev)
        }}
      >
        Toggle Plane Rotation
      </button>

      <div className="flex gap-3 mt-4">
        <button
          className={btnCls}
          onClick={() => {
            setSpherePosition(pre => ({ ...pre, x: pre.x === 0.2 ? 0.3 : 0.2 }))
          }}
        >
          Toggle Sphere Position
        </button>
        <button
          className={btnCls}
          onClick={() => {
            setSphereRotationOn(prev => !prev)
          }}
        >
          Toggle Sphere Rotation
        </button>

        <button
          className={btnCls}
          onClick={() => {
            setConePosition(pre => ({ ...pre, x: pre.x === 0.4 ? 0.5 : 0.4 }))
          }}
        >
          Toggle Cone Position
        </button>
        <button
          className={btnCls}
          onClick={() => {
            setConeRotationOn(prev => !prev)
          }}
        >
          Toggle Cone Rotation
        </button>

        <button
          className={btnCls}
          onClick={() => {
            setCylinderPosition(pre => ({
              ...pre,
              x: pre.x === 0.6 ? 0.7 : 0.6,
            }))
          }}
        >
          Toggle Cylinder Position
        </button>
        <button
          className={btnCls}
          onClick={() => {
            setCylinderRotationOn(prev => !prev)
          }}
        >
          Toggle Cylinder Rotation
        </button>
      </div>

      <div>
        <div>console</div>
        <p style={{ fontSize: '46px' }}>{logs}</p>
        <Reality
          id="testReality"
          style={{
            width: '500px',
            height: '800px',
            '--xr-depth': 100,
            '--xr-back': 200,
          }}
          ref={realityRef}
          onSpatialTap={async e => {
            console.log('tap reality', e, e.target, e.currentTarget)
            // e.target not work as expected, use e.currentTarget instead
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
          <UnlitMaterial
            id="matBlack"
            color="#000000"
            transparent={true}
            opacity={0.5}
          />
          <UnlitMaterial
            id="mat5"
            color="#eb45b7"
            transparent={true}
            opacity={0.5}
          />
          <UnlitMaterial
            id="mat6"
            color="#0e4c20"
            transparent={true}
            opacity={0.5}
          />
          <SceneGraph>
            <Entity
              position={{ x: 0, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
            >
              <BoxEntity
                id="boxRed"
                name="boxRedName"
                ref={boxEntRef}
                width={0.2}
                height={0.2}
                depth={0.1}
                cornerRadius={1}
                materials={[
                  'matRed',
                  'matGreen',
                  'matBlue',
                  'matBlack',
                  'mat5',
                  'mat6',
                ]}
                splitFaces={true}
                position={boxPosition}
                rotation={boxRotation}
                onSpatialTap={async e => {
                  setShowModelEntity(pre => !pre)
                  console.log('ent parent', entRef.current?.entity?.parent)
                }}
              ></BoxEntity>
              <SphereEntity
                id="sphereGreen"
                radius={0.1}
                materials={['matGreen']}
                position={spherePosition}
                rotation={sphereRotation}
              ></SphereEntity>
              <ConeEntity
                radius={0.1}
                height={0.1}
                materials={['matGreen']}
                position={conePosition}
                rotation={coneRotation}
              ></ConeEntity>
              <CylinderEntity
                radius={0.1}
                height={0.1}
                materials={['matGreen']}
                position={cylinderPosition}
                rotation={cylinderRotation}
              ></CylinderEntity>

              <PlaneEntity
                width={0.1}
                height={0.1}
                cornerRadius={0.01}
                materials={['matGreen']}
                position={planePosition}
                rotation={planeRotation}
              ></PlaneEntity>
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}

// Initialize react
var root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.createRoot(root).render(
  // todo: add strict mode to check destroy
  <React.StrictMode>
    <App />,
  </React.StrictMode>,
)
document.documentElement.style.backgroundColor = 'transparent'
document.body.style.backgroundColor = 'transparent'
// Force page height to 100% to get centering to work
document.documentElement.style.height = '100%'
document.body.style.height = '100%'
root.style.height = '100%'
