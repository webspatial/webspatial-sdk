import React, { useEffect, useRef, useState } from 'react'
import {
  enableDebugTool,
  Model,
  convertCoordinate,
} from '@webspatial/react-sdk'

enableDebugTool()

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

export default function ModelSpatialDivConvertTest() {
  const [logs, setLogs] = useState('')
  const logsRef = useRef<HTMLPreElement>(null)

  const modelARef = useRef<any>(null)
  const divBRef = useRef<HTMLDivElement>(null)

  const initialModelPos = { x: 100, y: 100, z: 0 }
  const [modelAPos, setModelAPos] = useState(initialModelPos)

  const initialDivPos = { x: 100, y: 100, z: 0 }
  const [divBPos, setDivBPos] = useState(initialDivPos)

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
    const aRef = modelARef.current
    const bRef = divBRef.current
    if (!aRef || !bRef) {
      log('Move A to B failed: refs not ready')
      return
    }

    // Calculate Div B's center relative to Model A's local coordinate system
    //     const bCenter = {
    //       x: bRef.offsetWidth / 2,
    //       y: bRef.offsetHeight / 2,
    //       z: 0,
    //     }
    const bCenterInA = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      {
        from: bRef,
        to: aRef,
      },
    )

    log('B center relative to A:', bCenterInA)

    // To move A to B's center, we add B center's relative offset (in A's space) to A's current position
    setModelAPos(prev => ({
      x: (prev.x ?? 0) + (bCenterInA.x ?? 0),
      y: (prev.y ?? 0) + (bCenterInA.y ?? 0),
      z: (prev.z ?? 0) + (bCenterInA.z ?? 0),
    }))

    log("Moved Model A to Div B's center by relative offset")
  }

  async function handleMoveBToA() {
    const aRef = modelARef.current
    const bRef = divBRef.current
    if (!aRef || !bRef) {
      log('Move B to A failed: refs not ready')
      return
    }

    // Calculate Model A's center (origin 0,0,0) relative to Div B's local coordinate system
    const aInB = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aRef, to: bRef },
    )

    log('A origin relative to B:', aInB)

    // To move B to A's origin, we add A's relative offset (in B's space) to B's current position
    // Since Div B's origin is top-left, we might want to center it, but let's just move its origin for now.
    setDivBPos(prev => ({
      x: (prev.x ?? 0) + (aInB.x ?? 0),
      y: (prev.y ?? 0) + (aInB.y ?? 0),
      z: (prev.z ?? 0) + (aInB.z ?? 0),
    }))

    log('Moved Div B to Model A origin by relative offset')
  }

  function handleReset() {
    setModelAPos(initialModelPos)
    setDivBPos(initialDivPos)
    log('Positions reset')
  }

  async function handlePrintLocal() {
    const aRef = modelARef.current
    const bRef = divBRef.current

    if (!aRef || !bRef) {
      log('Print local failed: refs not ready')
      return
    }

    // A relative to its parent (the container div)
    const aParent = aRef.parentElement
    const aInParent = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aRef, to: aParent },
    )

    // B relative to its container (the div wrapping the spatial divs)
    const bParent = bRef.parentElement
    const bInParent = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: bRef, to: bParent },
    )

    log('Local Coords:')
    log('Model A (in container):', aInParent)
    log('Div B (in parent div):', bInParent)
  }

  async function handlePrintWindow() {
    const aRef = modelARef.current
    const bRef = divBRef.current

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
    log('Model A:', aInWindow)
    log('Div B:', bInWindow)
  }

  return (
    <div className="p-4 h-full flex flex-col text-white">
      <h1 className="text-2xl mb-4">Model & Spatial Div Convert Test</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={btnCls} onClick={handleMoveAToB}>
          Move A to B
        </button>
        <button className={btnCls} onClick={handleMoveBToA}>
          Move B to A
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
        {/* Model Section (Model A) */}
        <div className="flex-1 relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] flex flex-col">
          <div className="p-2 text-xs font-bold border-b border-gray-800 bg-gray-900/50">
            Model Container (Model A)
          </div>
          <div className="flex-1 relative">
            <Model
              ref={modelARef}
              enable-xr
              src="https://raw.githubusercontent.com/webspatial/test-assets/main/kenney/arcade-machine-color.usdz"
              style={
                {
                  width: '200px',
                  height: '200px',
                  position: 'absolute',
                  left: modelAPos.x,
                  top: modelAPos.y,
                  '--xr-back': 0,
                } as any
              }
            />
          </div>
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
                left: divBPos.x,
                top: divBPos.y,
                width: '120px',
                height: '120px',
                backgroundColor: '#0000ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                // '--xr-back': 120 + (divBPos.z ?? 0),
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
