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

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

enableDebugTool()

export default function RealityTest() {
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

  const modelEntRef = useRef<EntityRef>(null)
  const boxEntRef = useRef<EntityRef>(null)
  const [showBoxRed, setShowBoxRed] = useState(true)

  const realityRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)

  const [showModelEntity, setShowModelEntity] = useState(true)

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <h1 className="text-2xl mb-4">Reality Test</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          className={btnCls}
          onClick={async () => {
            setBoxPosition(prePos => ({
              ...prePos,
              x: prePos.x === 0 ? 0.1 : 0,
            }))
          }}
        >
          Toggle Red Box Position
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
          onClick={() => {
            setShowBoxRed(prev => !prev)
          }}
        >
          Toggle Red Box
        </button>
      </div>

      <div className="bg-black/40 p-4 rounded-lg mb-4">
        <div className="text-sm font-bold mb-2">Console Logs</div>
        <pre className="text-xs max-h-40 overflow-auto font-mono">{logs}</pre>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          id="testReality"
          style={{
            width: '100%',
            height: '600px',
            '--xr-depth': 100,
            '--xr-back': 200,
          }}
          ref={realityRef}
          // Allow spatial events on Reality in sample to keep previous behavior
          onSpatialTap={e => {
            // Log basic tap info
            log('tap', e.detail.location3D)
            log('tap offsetX/Y/Z', e.offsetX, e.offsetY, e.offsetZ)
            log('tap clientX/Y/Z', e.clientX, e.clientY, e.clientZ)
            // Heuristic routing by X position to mimic previous per-entity logs:
            // - left side ~ boxRed subtree
            // - right side ~ boxGreen subtree
            // - near center ~ model entity
            const x = e.clientX ?? 0
            if (Math.abs(x) < 0.08) {
              log('tap model')
            } else if (x < 0) {
              log('tap child') // previous left entity parent handler
            } else {
              log('tap box') // previous right box handler
              log('parent tap') // mimic parent entity tap bubbling
            }
          }}
          // Allow spatial events on Reality in sample to keep previous behavior
          onSpatialDragStart={e => {
            // Only treat drags on the right side as the green box interactions
            if ((e.clientX ?? 0) >= 0) {
              log('dragStart', e.detail.startLocation3D)
              log('dragStart offsetX/Y/Z', e.offsetX, e.offsetY, e.offsetZ)
              log('dragStart clientX/Y/Z', e.clientX, e.clientY, e.clientZ)
            }
          }}
          // Allow spatial events on Reality in sample to keep previous behavior
          onSpatialDrag={e => {
            log('drag', e.detail.translation3D)
          }}
          // Allow spatial events on Reality in sample to keep previous behavior
          onSpatialDragEnd={e => {
            log('dragEnd')
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
          <ModelAsset
            id="model"
            src="/assets/vehicle-speedster.usdz"
            onLoad={() => {
              console.log('model load')
            }}
            onError={e => {
              console.log('model error', e)
            }}
          >
            <source
              src="/assets/vehicle-speedster.usdz"
              type="model/vnd.usdz+zip"
            />
          </ModelAsset>
          <SceneGraph>
            <Entity
              position={{ x: -0.2, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
            >
              {showBoxRed && (
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
                ></BoxEntity>
              )}
            </Entity>
            <Entity
              id="hehe"
              name="hehehe"
              position={{ x: 0.2, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
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
              ></BoxEntity>
            </Entity>
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
