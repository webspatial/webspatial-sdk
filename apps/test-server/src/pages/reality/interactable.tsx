import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  BoxEntity,
  enableDebugTool,
  Entity,
  EntityRef,
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  SpatializedElementRef,
  UnlitMaterial,
} from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

enableDebugTool()

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

  const realityRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)

  return (
    <div className="pl-5 pt-2">
      <h1 className="text-2xl text-black">reality test</h1>

      <div>
        <div style={{ fontSize: '46px' }}>console</div>
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
          <ModelAsset
            id="model"
            // src="http://localhost:5173/public/assets/vehicle-speedster.usdz"
            // src="http://10.0.2.2:5173/public/assets/RocketToy1.usdz"
            src="/assets/vehicle-speedster.usdz"
            onLoad={() => {
              console.log('model load')
            }}
            onError={e => {
              console.log('model error', e)
            }}
          />
          <SceneGraph>
            {/* case 1  parent enables tap, C inherits interactable via A */}
            <Entity
              id="A"
              onSpatialTap={e => {
                log('tap A')
                console.log('tap A', e)
              }}
            >
              <Entity
                id="B"
                onSpatialTap={e => {
                  log('tap B')
                  console.log('tap B', e)
                }}
              >
                <BoxEntity width={0.1} height={0.1} depth={0.1} />
              </Entity>
            </Entity>

            {/* case 2  parent disables, no other ancestor enables tap */}
            <Entity>
              <BoxEntity
                id="C"
                position={{ x: 0.15, y: 0, z: 0 }}
                width={0.1}
                height={0.1}
                depth={0.1}
                onSpatialTap={e => {
                  log('tap C')
                  console.log('tap C', e)
                }}
              />
            </Entity>
            {/* nested */}
            <Entity
              onSpatialTap={e => {
                log('tap ' + e.target.id)
                console.log('tap', e.target.id)
              }}
            >
              <Entity>
                <BoxEntity
                  id="D1"
                  position={{ x: 0.3, y: 0, z: 0 }}
                  width={0.1}
                  height={0.1}
                  depth={0.1}
                />
              </Entity>
              <Entity>
                <BoxEntity
                  id="D2"
                  position={{ x: 0.45, y: 0, z: 0 }}
                  width={0.1}
                  height={0.1}
                  depth={0.1}
                />
              </Entity>
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}

export default App
