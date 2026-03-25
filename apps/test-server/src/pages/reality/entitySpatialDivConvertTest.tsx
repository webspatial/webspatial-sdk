import React, { useEffect, useRef, useState } from 'react'
import {
  BoxEntity,
  enableDebugTool,
  EntityRef,
  Reality,
  SceneGraph,
  SpatializedElementRef,
  UnlitMaterial,
  convertCoordinate,
} from '@webspatial/react-sdk'

enableDebugTool()

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

export default function EntitySpatialDivConvertTest() {
  const [logs, setLogs] = useState('')
  const logsRef = useRef<HTMLPreElement>(null)

  const entityARef = useRef<EntityRef>(null)
  const divBRef = useRef<HTMLDivElement>(null)
  const realityRef = useRef<SpatializedElementRef<HTMLDivElement>>(null)

  const initialEntityPos = { x: -0.2, y: 0, z: 0 }
  const [entityAPos, setEntityAPos] = useState(initialEntityPos)

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
          ans += JSON.stringify(item, Object.keys(item).sort())
        } else {
          ans += item
        }
      }
      return ans
    })
  }

  async function handleMoveAToB() {
    const aRef = entityARef.current as any
    const bRef = divBRef.current as any
    if (!aRef || !bRef) {
      log('Move A to B failed: refs not ready')
      return
    }

    // Calculate Div B's center relative to Entity A's local coordinate system
    const bCenter = {
      x: bRef.offsetWidth / 2,
      y: bRef.offsetHeight / 2,
      z: 0,
    }
    const bCenterInA = await convertCoordinate(bCenter, {
      from: bRef,
      to: aRef,
    })

    log('B center relative to A:', bCenterInA)

    // To move A to B's center, we add B center's relative offset (in A's space) to A's current position
    setEntityAPos(prev => ({
      x: (prev.x ?? 0) + (bCenterInA.x ?? 0),
      y: (prev.y ?? 0) + (bCenterInA.y ?? 0),
      z: (prev.z ?? 0) + (bCenterInA.z ?? 0),
    }))

    log("Moved Entity A to Div B's center by relative offset")
  }

  function handleReset() {
    setEntityAPos(initialEntityPos)
    log('Positions reset')
  }

  async function handlePrintLocal() {
    const aRef = entityARef.current as any
    const bRef = divBRef.current as any
    const rRef = realityRef.current as any

    if (!aRef || !bRef || !rRef) {
      log('Print local failed: refs not ready')
      return
    }

    // A relative to Reality (its effective container for positioning)
    const aInReality = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aRef, to: rRef },
    )

    // B relative to its container (the div wrapping the spatial divs)
    // Actually, let's just use window for "local" if the container isn't easily accessible,
    // but the user asked for "A and B in their containers".
    // For Entity A, Reality is the container.
    // For Div B, its parent div is the container.
    const bParent = bRef.parentElement
    const bInParent = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: bRef, to: bParent },
    )

    log('Local Coords:')
    log('Entity A (in Reality):', aInReality)
    log('Div B (in Parent Div):', bInParent)
  }

  async function handlePrintWindow() {
    const aRef = entityARef.current as any
    const bRef = divBRef.current as any

    if (!aRef || !bRef) {
      log('Print window failed: refs not ready')
      return
    }

    const aInWindow = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aRef, to: window as any },
    )
    const bInWindow = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: bRef, to: window as any },
    )

    log('Window Coords:')
    log('Entity A:', aInWindow)
    log('Div B:', bInWindow)
  }

  return (
    <div className="p-4 h-full flex flex-col text-white">
      <h1 className="text-2xl mb-4">Entity & Spatial Div Convert Test</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={btnCls} onClick={handleMoveAToB}>
          Move A to B
        </button>
        <button className={btnCls} onClick={handleReset}>
          Reset
        </button>
        <button className={btnCls} onClick={handlePrintLocal}>
          Print Local
        </button>
        <button className={btnCls} onClick={handlePrintWindow}>
          Print Window
        </button>
        <button className={btnCls} onClick={() => setLogs('')}>
          Clear Logs
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Reality Section (Entity A) */}
        <div className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] flex flex-col">
          <div className="p-2 text-xs font-bold border-b border-gray-800 bg-gray-900/50">
            Reality (Entity A)
          </div>
          <Reality
            ref={realityRef}
            style={{
              width: '100%',
              flex: 1,
              '--xr-depth': 100,
              '--xr-back': 200,
            }}
          >
            <UnlitMaterial
              id="matRed"
              color="#ff0000"
              transparent
              opacity={0.8}
            />
            <SceneGraph>
              <BoxEntity
                ref={entityARef}
                name="entityA"
                width={0.1}
                height={0.1}
                depth={0.1}
                materials={['matRed']}
                position={entityAPos}
              />
            </SceneGraph>
          </Reality>
        </div>

        {/* Spatial Div Section (Div B) */}
        <div className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] flex flex-col">
          <div className="p-2 text-xs font-bold border-b border-gray-800 bg-gray-900/50">
            Spatial Div Container (Div B)
          </div>
          <div className="flex-1 relative p-8">
            <div
              ref={divBRef}
              enable-xr
              style={{
                position: 'absolute',
                left: '100px',
                top: '100px',
                width: '120px',
                height: '120px',
                backgroundColor: '#0000ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                '--xr-back': 120,
                '--xr-background-material': 'thin',
              }}
            >
              Div B
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/40 p-4 rounded-lg mt-4 h-48 flex flex-col">
        <div className="text-sm font-bold mb-2">Console Logs</div>
        <pre
          ref={logsRef}
          className="text-xs flex-1 overflow-auto font-mono text-gray-300"
        >
          {logs}
        </pre>
      </div>
    </div>
  )
}
