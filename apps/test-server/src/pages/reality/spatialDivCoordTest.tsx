import React, { useEffect, useRef, useState } from 'react'
import { enableDebugTool, convertCoordinate } from '@webspatial/react-sdk'

enableDebugTool()

const btnCls =
  'select-none px-4 py-1 text-s font-semibold rounded-full border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-700 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2'

export default function SpatialDivCoordTest() {
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

  // 2D SpatialDiv setup
  const parentRef = useRef<HTMLDivElement>(null)
  const aDivRef = useRef<HTMLDivElement>(null)
  const [bTranslate] = useState({ x: 240, y: 120, z: 0 })
  const [aTranslate, setATranslate] = useState({ x: 40, y: 40, z: 0 })
  const bDivRef = useRef<HTMLDivElement>(null)

  async function handleMove2DAtoB() {
    const aEl = aDivRef.current as any
    const bEl = bDivRef.current as any
    if (!aEl || !bEl) {
      log('2D Move A to B failed: refs not ready')
      return
    }
    // aInB = Position of A's origin in B's local (px) coordinate system (relative displacement)
    const aInB = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aEl, to: bEl },
    )
    // Use relative displacement directly: move A in the opposite direction to align A's origin with B's origin
    setATranslate(prev => ({
      x: (prev.x ?? 0) - (aInB.x ?? 0),
      y: (prev.y ?? 0) - (aInB.y ?? 0),
      z: (prev.z ?? 0) - (aInB.z ?? 0),
    }))
    log('2D A->B delta (aEl→bEl relative displacement):', aInB)
  }

  function handleResetA2D() {
    // Reset A to its initial position
    setATranslate({ x: 40, y: 40, z: 0 })
  }

  async function handlePrintWindowCoords() {
    const aEl = aDivRef.current as any
    const bEl = bDivRef.current as any
    if (!aEl || !bEl) {
      log('Print window coords failed: refs not ready')
      return
    }

    const aInWindow = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aEl, to: window as any },
    )
    const bInWindow = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: bEl, to: window as any },
    )

    log('A in Window:', aInWindow)
    log('B in Window:', bInWindow)
  }

  async function handlePrintParentCoords() {
    const aEl = aDivRef.current as any
    const bEl = bDivRef.current as any
    const pEl = parentRef.current as any
    if (!aEl || !bEl || !pEl) {
      log('Print parent coords failed: refs not ready')
      return
    }

    const aInParent = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: aEl, to: pEl },
    )
    const bInParent = await convertCoordinate(
      { x: 0, y: 0, z: 0 },
      { from: bEl, to: pEl },
    )

    log('A Top-Left in Parent:', aInParent)
    log('B Top-Left in Parent:', bInParent)
  }

  function handleClearLogs() {
    setLogs('')
  }

  return (
    <div className="p-4 overflow-auto h-full text-white">
      <h1 className="text-2xl mb-4">2D SpatialDiv Coord Convert Test</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={btnCls} onClick={handleClearLogs}>
          Clear Logs
        </button>
      </div>

      {/* 2D SpatialDiv Section */}
      <div className="mt-6">
        <div className="text-sm font-bold mb-2">2D SpatialDiv (A / B)</div>
        <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] p-4">
          <div
            ref={parentRef}
            enable-xr
            className="relative"
            style={{ width: '100%', height: '240px' }}
          >
            <div
              id="spatialA"
              ref={aDivRef}
              enable-xr
              style={{
                position: 'absolute',
                left: aTranslate.x,
                top: aTranslate.y,
                width: '180px',
                height: '120px',
                backgroundColor: '#ff0000',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                '--xr-back': 120,
                '--xr-background-material': 'thin',
              }}
            >
              A
            </div>
            <div
              id="spatialB"
              ref={bDivRef}
              enable-xr
              style={{
                position: 'absolute',
                left: bTranslate.x,
                top: bTranslate.y,
                width: '180px',
                height: '120px',
                backgroundColor: '#0000ff',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                '--xr-back': 120,
                '--xr-background-material': 'thin',
              }}
            >
              B
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <button className={btnCls} onClick={handleMove2DAtoB}>
              Move2DAtoB
            </button>
            <button className={btnCls} onClick={handleResetA2D}>
              Reset A
            </button>
            <button className={btnCls} onClick={handlePrintWindowCoords}>
              Print Window Coords
            </button>
            <button className={btnCls} onClick={handlePrintParentCoords}>
              Print Parent Coords
            </button>
          </div>
        </div>
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
