import React, { useEffect, useRef, useState } from 'react'
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

enableDebugTool()

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

export default function RealityDebug() {
  const [logs, setLogs] = useState('')

  useEffect(() => {
    const fn = async () => {
      try {
        // @ts-ignore
        if (typeof inspectCurrentSpatialScene === 'function') {
          // @ts-ignore
          const ans = await inspectCurrentSpatialScene()
          console.log('🚀 ~ ans:', ans)
          console.log('🚀 ~ spatialObjectCount:', ans.spatialObjectCount)
        }
      } catch (error) {
        console.log('🚀 ~ fn ~ error:', error)
      }
    }

    setTimeout(() => {
      fn()
    }, 100)

    return () => {}
  }, [])

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

  const modelEntRef = useRef<EntityRef>(null)
  const boxEntRef = useRef<EntityRef>(null)
  const realityRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)
  const [showModelEntity, setShowModelEntity] = useState(true)
  const [showEntity, setShowEntity] = useState(true)

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-4">Reality Debug</h1>
      <button
        className={btnCls}
        onClick={async () => {
          setShowEntity(prev => !prev)
        }}
      >
        {showEntity ? 'Hide' : 'Show'} Entity
      </button>

      <div className="my-6 bg-black/40 p-4 rounded-lg">
        <div className="text-sm font-bold mb-2">Console Logs</div>
        <pre className="text-xs max-h-40 overflow-auto font-mono">{logs}</pre>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          id="debugReality"
          style={{
            width: '100%',
            height: '600px',
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
          <ModelAsset id="model" src="/assets/vehicle-speedster.usdz">
            <source
              src="/assets/vehicle-speedster.usdz"
              type="model/vnd.usdz+zip"
            />
          </ModelAsset>
          <SceneGraph>
            {showEntity && (
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
                  materials={['matRed']}
                  position={boxPosition}
                  rotation={boxRotation}
                  onSpatialTap={async e => {
                    setShowModelEntity(pre => !pre)
                  }}
                ></BoxEntity>
              </Entity>
            )}
            {showModelEntity && (
              <Entity>
                <ModelEntity
                  id="modelEnt"
                  name="modelEntName"
                  model="model"
                  ref={modelEntRef}
                  rotation={boxRotation}
                  scale={{ x: 0.2, y: 0.2, z: 0.2 }}
                />
              </Entity>
            )}
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}
