import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BoxEntity,
  enableDebugTool,
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
import { Reality } from '@webspatial/react-sdk'

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

  const [showModelEntity, setShowModelEntity] = useState(true)

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">openscene</h1>

      {/* <button
        className={btnCls}
        onClick={async () => {
          const session = getSession()!
          const reality = await session.createSpatializedDynamic3DElement()
          const spatialScene = session.getSpatialScene()
          await spatialScene.addSpatializedElement(reality)
        }}
      >
        create reality
      </button> */}

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
        <div
          enable-xr
          data-name="parent"
          style={{
            width: '200px',
            height: '200px',
            '--xr-back': 100,
            background: 'green',
            transform: 'translateZ(111px)     ',
            transformOrigin: 'bottom center',
          }}
        >
          <div>div1</div>
          <div
            // enable-xr
            data-name="child"
            style={{
              width: '200px',
              height: '200px',
              '--xr-back': 100,
              background: 'red',
            }}
          >
            <div>div2</div>
          </div>
        </div>
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
