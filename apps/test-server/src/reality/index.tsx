import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BoxEntity,
  Entity,
  EntityRef,
  getSession,
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  SpatializedElementRef,
  UnlitMaterial,
} from '@webspatial/react-sdk'

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

  const entRef = useRef<EntityRef>(null)
  const modelEntRef = useRef<EntityRef>(null)
  const boxEntRef = useRef<EntityRef>(null)

  const realityRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)

  const [showModelEntity, setShowModelEntity] = useState(true)

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">reality test</h1>

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
        <Reality
          id="testReality"
          style={{
            width: '500px',
            height: '800px',
            '--xr-depth': 100,
            '--xr-back': 200,
          }}
          ref={realityRef}
        >
          <UnlitMaterial id="matRed" color="#ff0000" />
          <UnlitMaterial id="matGreen" color="#00ff00" />
          <ModelAsset
            id="model"
            src="http://localhost:5173/public/assets/RocketToy1.usdz"
            onLoad={() => {
              console.log('model load')
            }}
            onError={e => {
              console.log('model error', e)
            }}
          />
          <SceneGraph>
            <Entity
              position={{ x: -0.2, y: 0, z: 0 }}
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
                  'matRed',
                  'matGreen',
                  'matRed',
                  'matGreen',
                ]}
                splitFaces={true}
                position={boxPosition}
                rotation={boxRotation}
                onSpatialTap={async e => {
                  setShowModelEntity(pre => !pre)
                  console.log('ent parent', entRef.current?.entity?.parent)
                }}
              ></BoxEntity>
            </Entity>
            <Entity
              id="hehe"
              name="hehehe"
              position={{ x: 0.2, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
              ref={entRef}
              // onSpatialTap={async e => {
              //   console.log('parent tap', e.detail.location3D)
              // }}
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
                  // console.log('tap box', e.detail.location3D)
                  // const pos = await myRef.current?.convertFromEntityToEntity(
                  //   'boxGreen',
                  //   'boxRed',
                  //   e.detail.location3D,
                  // )
                  // console.log('🚀 ~ pos:', pos)
                  // const pos2 = await myRef.current?.convertFromEntityToScene(
                  //   'boxGreen',
                  //   e.detail.location3D,
                  // )
                  // console.log('🚀 ~ pos2:', pos2)
                  // const pos3 = await myRef.current?.convertFromSceneToEntity(
                  //   'boxGreen',
                  //   e.detail.location3D,
                  // )
                  // console.log('🚀 ~ pos3:', pos3)
                  // console.log(
                  //   'realityRef.current:',
                  //   realityRef.current?.clientDepth,
                  //   realityRef.current?.offsetBack,
                  //   realityRef.current?.getBoundingClientCube(),
                  // )
                  // const domEleReality = document.getElementById("testReality")
                  // console.log("🚀 ~ domEleReality:", domEleReality)

                  // console.log(
                  //   'entity position',
                  //   document.getElementById('boxGreen'),
                  // )
                  // console.log(entRef.current)
                  // console.log(boxEntRef.current)
                  // console.log('children tap', e.detail.location3D)

                  // console.log('boxGreen children', boxEntRef.current?.entity)

                  console.log(
                    'realityRef.current:',
                    realityRef.current?.offsetBack,
                  )
                  // console.log('ent parent', entRef.current?.entity?.parent)
                }}
              ></BoxEntity>
            </Entity>
            {showModelEntity && (
              <ModelEntity
                id="modelEnt"
                name="modelEntName"
                model="model"
                ref={modelEntRef}
                rotation={boxRotation}
                onSpatialTap={e => {
                  // console.log('tap model', e.detail.location3D)
                  // console.log(modelEntRef.current)
                }}
              />
            )}
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
