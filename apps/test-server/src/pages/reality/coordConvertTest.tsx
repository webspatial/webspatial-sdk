import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BoxEntity,
  enableDebugTool,
  Entity,
  EntityRef,
  Reality,
  SceneGraph,
  SpatializedElementRef,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import { convertCoordinate } from '@webspatial/react-sdk'

enableDebugTool()

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
        const item = args[i]
        if (typeof item === 'object' && item !== null) {
          // Use JSON.stringify's replacer array to fix the order of all keys
          ans += JSON.stringify(item, Object.keys(item).sort())
        } else {
          ans += item
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
    const pos = fromPosition //{ x: 0.1, y: 0.1, z: 0.1 }
    const ret = await convertCoordinate(pos, {
      from: fromEntityRef.current as any,
      to: toEntityRef.current as any,
    })
    log('A->B result:', ret)
  }
  async function handleConvertBtoA() {
    const pos = toPosition
    const ret = await convertCoordinate(pos, {
      from: toEntityRef.current as any,
      to: fromEntityRef.current as any,
    })
    log('B->A result:', ret)
  }
  // convert A position to B, then convert back to A
  async function handleConvertAtoBThenA() {
    const original = fromPosition
    const toPos = await convertCoordinate(original, {
      from: fromEntityRef.current as any,
      to: toEntityRef.current as any,
    })
    const backPos = await convertCoordinate(toPos, {
      from: toEntityRef.current as any,
      to: fromEntityRef.current as any,
    })
    // log round-trip difference
    const diff = {
      x: (backPos.x ?? 0) - (original.x ?? 0),
      y: (backPos.y ?? 0) - (original.y ?? 0),
      z: (backPos.z ?? 0) - (original.z ?? 0),
    }
    log('A->B:', toPos)
    log('A->B->A:', backPos, 'diff:', diff)
  }
  async function handleConvertAtoWindow() {
    const pos = fromPosition //{ x: 0.1, y: 0.1, z: 0.1 }
    const ret = await convertCoordinate(pos, {
      from: fromEntityRef.current as any,
      to: window as any,
    })
    log('A->window result:', ret)
  }
  async function handleMoveBToA() {
    const fromRef = fromEntityRef.current as any
    const toRef = toEntityRef.current as any
    if (!fromRef || !toRef) {
      log('Move B to A failed: refs not ready')
      return
    }
    const target = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: fromRef, to: toRef },
    )
    setToPosition({
      x: target.x ?? 0,
      y: target.y ?? 0,
      z: target.z ?? 0,
    })
    log('Move B to A target:', target)
  }
  async function handleMoveAToB() {
    const fromRef = fromEntityRef.current as any
    const toRef = toEntityRef.current as any
    if (!fromRef || !toRef) {
      log('Move A to B failed: refs not ready')
      return
    }
    const target = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: toRef, to: fromRef },
    )
    setFromPosition({
      x: target.x ?? 0,
      y: target.y ?? 0,
      z: target.z ?? 0,
    })
    log('Move A to B target:', target)
  }
  function handleClearLogs() {
    setLogs('')
  }

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Coord Convert Test</h1>
        <Link
          to="/reality/spatial-div-coord"
          className="text-blue-400 hover:underline text-sm"
        >
          Go to 2D SpatialDiv Coord Test →
        </Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={btnCls} onClick={handleClearLogs}>
          Clear Logs
        </button>
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
        <button className={btnCls} onClick={handleConvertAtoBThenA}>
          convertCoordinate A→B→A
        </button>
        <button className={btnCls} onClick={handleConvertAtoWindow}>
          convertCoordinate A→window
        </button>
        <button className={btnCls} onClick={handleMoveAToB}>
          Move A to B
        </button>
        <button className={btnCls} onClick={handleMoveBToA}>
          Move B to A
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
