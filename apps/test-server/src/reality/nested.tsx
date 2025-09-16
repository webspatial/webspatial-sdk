import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BoxEntity,
  Entity,
  EntityRef,
  getSession,
  Model,
  ModelAsset,
  ModelEntity,
  // Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import { SpatialEntity } from '@webspatial/core-sdk'
import { Reality } from '@webspatial/react-sdk'

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

  const entityRef = useRef<SpatialEntity>()
  const animationRef = useRef<any>()
  const rotationRef = useRef<number>(0)

  const [isAnimationOn, setIsAnimationOn] = useState(false)

  function startAnimation() {
    if (!entityRef.current) return
    if (animationRef.current) return
    function doRotate(delta: number) {
      entityRef.current?.setRotation({
        x: 0,
        y: 0,
        z: rotationRef.current + 0.1 * delta,
      })
      animationRef.current = requestAnimationFrame(doRotate)
    }
    doRotate(0)
    setIsAnimationOn(true)
  }

  function cancelAnimation() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
      setIsAnimationOn(false)
    }
  }

  // const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
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

  const myRef = useRef<EntityRef>(null)

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">openscene</h1>

      <button
        className={btnCls}
        onClick={async () => {
          const session = getSession()!
          const reality = await session.createSpatializedDynamic3DElement()
          const spatialScene = session.getSpatialScene()
          await spatialScene.addSpatializedElement(reality)
        }}
      >
        create reality
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          if (isAnimationOn) {
            cancelAnimation()
          } else {
            startAnimation()
          }
        }}
      >
        rotation animation {isAnimationOn ? 'stop' : 'start'}
      </button>

      <h1 className="text-2xl text-black">openscene</h1>

      <button
        className={btnCls}
        onClick={async () => {
          setBoxPosition(prePos => ({ ...prePos, x: prePos.x === 0 ? 0.1 : 0 }))
        }}
      >
        toggle red box position
      </button>

      <button
        className={btnCls}
        onClick={async () => {
          setBoxRotationOn(prev => !prev)
        }}
      >
        toggle box rotation
      </button>

      <div>
        <div>console</div>
        <p style={{ fontSize: '46px' }}>{logs}</p>
        {/* <div
          enable-xr
          style={{
            '--xr-back': 121,
          }}
          className="text-blue fixed w-full  bg-base-200	bg-clip-border px-6 py-6  "
        >
          <a href="#">Go Back</a>
        </div> */}
        {/* <div
          enable-xr
          style={{
            width: '200px',
            height: '200px',
            '--xr-back': 100,
            background: 'red',
          }}
        >
          <div>div2</div>
        </div> */}
        {/* <Model enable-xr style={{ width: '200px', height: '200px' }}>
          <source
            src="https://raw.githubusercontent.com/webspatial/test-assets/main/kenney/arcade-machine-color.usdz"
            type="model/vnd.usdz+zip"
          />
          <source
            src="https://raw.githubusercontent.com/webspatial/test-assets/main/kenney/arcade-machine-color.glb"
            type="model/gltf-binary"
          />
        </Model> */}
        <div
          enable-xr
          style={{
            width: '200px',
            height: '200px',
            '--xr-back': 100,
            background: 'green',
          }}
        ></div>

        <Reality
          style={{
            width: '800px',
            height: '500px',
            '--xr-depth': 200,
          }}
        >
          <UnlitMaterial id="matRed" color="#ff0000" />
          <UnlitMaterial id="matGreen" color="#00ff00" />
          <ModelAsset
            id="model"
            src="http://localhost:5173/public/assets/RocketToy1.usdz"
          />
          <SceneGraph>
            <Entity
              position={{ x: -0.2, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
            >
              <BoxEntity
                id="boxRed"
                width={0.2}
                height={0.2}
                depth={0.1}
                cornerRadius={1}
                materials={['matRed']}
                position={boxPosition}
                rotation={boxRotation}
              ></BoxEntity>
            </Entity>
            <Entity
              position={{ x: 0.2, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
              ref={myRef}
            >
              <BoxEntity
                id="boxGreen"
                width={0.2}
                height={0.2}
                depth={0.1}
                cornerRadius={0.5}
                materials={['matGreen']}
                position={{ x: 0, y: 0, z: 0 }}
                rotation={boxRotation}
                onSpatialTap={async e => {
                  console.log('tap box', e.detail.location3D)
                  const pos = await myRef.current?.convertFromEntityToEntity(
                    'boxGreen',
                    'boxRed',
                    e.detail.location3D,
                  )
                  console.log('🚀 ~ pos:', pos)
                  const pos2 = await myRef.current?.convertFromEntityToScene(
                    'boxGreen',
                    e.detail.location3D,
                  )
                  console.log('🚀 ~ pos2:', pos2)
                }}
              ></BoxEntity>
            </Entity>
            <ModelEntity
              model="model"
              rotation={boxRotation}
              onSpatialTap={e => {
                console.log('tap model', e.detail.location3D)
              }}
            />
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
