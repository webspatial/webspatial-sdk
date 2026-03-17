import React, { useEffect, useRef, useState } from 'react'
import {
  BoxEntity,
  Entity,
  EntityRef,
  Reality,
  SceneGraph,
  SpatializedElementRef,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import { convertCoordinate } from '@webspatial/react-sdk'

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

export default function CoordConvertTest() {
  const [logs, setLogs] = useState('')
  const logsRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    window.onerror = (error: any) => {
      log('error:', error.message)
    }
    return () => {
      window.onerror = null
    }
  }, [])

  useEffect(() => {
    const el = logsRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [logs])

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

  const realityARef = useRef<SpatializedElementRef<HTMLDivElement>>(null)
  const realityBRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)
  const fromEntityRef = useRef<EntityRef>(null)
  const toEntityRef = useRef<EntityRef>(null)

  const [fromPosition, setFromPosition] = useState({ x: 0, y: 0, z: 0 })
  const [toPosition, setToPosition] = useState({ x: 0, y: 0, z: 0 })
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })

  const [rotOn, setRotOn] = useState(false)
  const animRef = useRef<number | null>(null)
  useEffect(() => {
    if (rotOn) {
      function step(delta: number) {
        setRotation(r => ({ x: 0, y: 0, z: r.z + 0.1 * delta }))
        animRef.current = requestAnimationFrame(step)
      }
      step(0)
    } else {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
        animRef.current = null
      }
    }
    return () => {}
  }, [rotOn])

  async function handleConvertAtoB() {
    const pos = { x: 0.1, y: 0.2, z: 0.3 }
    const ret = await convertCoordinate(pos, {
      from: fromEntityRef.current as any,
      to: toEntityRef.current as any,
    })
    log('A->B result:', ret)
  }
  async function handleConvertBtoA() {
    const pos = { x: 0.4, y: 0.5, z: 0.6 }
    const ret = await convertCoordinate(pos, {
      from: toEntityRef.current as any,
      to: fromEntityRef.current as any,
    })
    log('B->A result:', ret)
  }
  async function handleConvertAtoWindow() {
    const pos = { x: 0.1, y: 0.1, z: 0.1 }
    const ret = await convertCoordinate(pos, {
      from: fromEntityRef.current as any,
      to: window as any,
    })
    log('A->window result:', ret)
  }

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <h1 className="text-2xl mb-4">Coord Convert Test</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          className={btnCls}
          onClick={() =>
            setFromPosition(p => ({ ...p, x: p.x === 0 ? 0.15 : 0 }))
          }
        >
          Toggle From Position
        </button>
        <button className={btnCls} onClick={() => setRotOn(prev => !prev)}>
          Toggle Rotation
        </button>
        <button
          className={btnCls}
          onClick={() => setToPosition(p => ({ ...p, y: p.y === 0 ? 0.2 : 0 }))}
        >
          Toggle To Position
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
          <Reality
            id="realityA"
            style={{
              width: '100%',
              height: '300px',
              '--xr-depth': 100,
              '--xr-back': 200,
            }}
            ref={realityARef}
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
            <SceneGraph>
              <Entity
                id="entityA"
                name="entityA"
                position={{ x: -0.2, y: 0, z: 0 }}
              >
                <BoxEntity
                  id="boxA"
                  name="boxA"
                  ref={fromEntityRef}
                  width={0.2}
                  height={0.2}
                  depth={0.1}
                  cornerRadius={0.5}
                  materials={['matRed']}
                  position={fromPosition}
                  rotation={rotation}
                />
              </Entity>
            </SceneGraph>
          </Reality>
        </div>

        <div className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
          <Reality
            id="realityB"
            style={{
              width: '100%',
              height: '300px',
              '--xr-depth': 100,
              '--xr-back': 200,
            }}
            ref={realityBRef}
          >
            <UnlitMaterial
              id="matBlue"
              color="#0000ff"
              transparent={true}
              opacity={0.5}
            />
            <SceneGraph>
              <Entity
                id="entityB"
                name="entityB"
                position={{ x: 0.2, y: 0, z: 0 }}
              >
                <BoxEntity
                  id="boxB"
                  name="boxB"
                  ref={toEntityRef}
                  width={0.2}
                  height={0.2}
                  depth={0.1}
                  cornerRadius={0.5}
                  materials={['matBlue']}
                  position={toPosition}
                  rotation={rotation}
                />
              </Entity>
            </SceneGraph>
          </Reality>
        </div>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <button className={btnCls} onClick={handleConvertAtoB}>
          convertCoordinate A→B
        </button>
        <button className={btnCls} onClick={handleConvertBtoA}>
          convertCoordinate B→A
        </button>
        <button className={btnCls} onClick={handleConvertAtoWindow}>
          convertCoordinate A→window
        </button>
      </div>
      <div className="bg-black/40 p-4 rounded-lg mt-4">
        <div className="text-sm font-bold mb-2">Console Logs</div>
        <pre ref={logsRef} className="text-xs max-h-40 overflow-auto font-mono">
          {logs}
        </pre>
      </div>
    </div>
  )
}
