/**
 * Geometry Verification Page
 *
 * Use this page to verify tap gesture coordinate correctness (offsetX/Y/Z, clientX/Y/Z).
 *
 * Verification steps:
 * 1. Open this page in visionOS simulator or device
 * 2. Tap on the SpatialDiv(s) or Model(s) and check the tap log
 *
 * Expected behavior:
 * - offsetX/Y/Z: tap position in element's local space (top-left origin;
 *   z=0 is the front face, so offsetZ ≈ 0 when tapping the front face)
 * - clientX/Y/Z: tap position in SpatialScene global space
 * - Works for plain, rotated, scaled, nested SpatialDivs, and Model tap
 */
import React, { useState } from 'react'
import {
  enableDebugTool,
  Model,
  type ModelSpatialTapEvent,
} from '@webspatial/react-sdk'

enableDebugTool()

const MODEL_SRC =
  'https://utzmqao3qthjebc2.public.blob.vercel-storage.com/saeukkang.usdz'

export default function GeometryVerify() {
  const [logs, setLogs] = useState<string[]>([])
  const [enableRotation, setEnableRotation] = useState(false)
  const [enableScale, setEnableScale] = useState(false)

  const log = (msg: string) => {
    setLogs(prev => [...prev.slice(-50), msg])
    console.log(msg)
  }

  const onSpatialTap = (evt: any, label: string) => {
    const lines = [
      `--- Tap (${label}) ---`,
      `offsetX/Y/Z: ${evt.offsetX?.toFixed(2)} ${evt.offsetY?.toFixed(2)} ${evt.offsetZ?.toFixed(2)}`,
      `clientX/Y/Z: ${evt.clientX?.toFixed(2)} ${evt.clientY?.toFixed(2)} ${evt.clientZ?.toFixed(2)}`,
    ]
    lines.forEach(log)
  }

  const baseStyle: React.CSSProperties = {
    width: '200px',
    height: '200px',
    backgroundColor: 'green',
    '--xr-back': '10px',
  }

  const transformParts: string[] = ['translateX(100px) translateY(100px)']
  if (enableRotation) transformParts.push('rotateZ(45deg)')
  if (enableScale) transformParts.push('scale(1.5)')
  const divStyle: React.CSSProperties = {
    ...baseStyle,
    transform: transformParts.length > 0 ? transformParts.join(' ') : undefined,
  }

  const nestedOuterStyle: React.CSSProperties = {
    width: '300px',
    height: '300px',
    backgroundColor: 'rgba(0, 0, 255, 1)',
    '--xr-back': '10px',
    transform: 'translateX(50px) translateY(30px) rotateX(45deg)',
  }

  const nestedInnerStyle: React.CSSProperties = {
    width: '150px',
    height: '150px',
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    '--xr-back': '5px',
    transform: 'translateX(30px) translateY(30px)',
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl mb-4">Geometry Verification</h1>
      <p className="text-gray-400 mb-4">
        Tap the SpatialDiv(s) to verify offsetX/Y/Z and clientX/Y/Z. Toggle
        rotation/scale to test transformed elements.
      </p>

      <div className="flex gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableRotation}
                onChange={e => setEnableRotation(e.target.checked)}
              />
              <span>Rotation (rotateZ 45°)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableScale}
                onChange={e => setEnableScale(e.target.checked)}
              />
              <span>Scale (1.5x)</span>
            </label>
          </div>
          <div
            enable-xr
            style={divStyle}
            className="rounded-lg cursor-pointer"
            onSpatialTap={evt =>
              onSpatialTap(
                evt,
                [enableRotation && 'rotated', enableScale && 'scaled']
                  .filter(Boolean)
                  .join(' ') || 'plain',
              )
            }
          />
          <p className="text-sm text-gray-500">
            200×200 SpatialDiv
            {(enableRotation || enableScale) && (
              <span className="ml-2 text-amber-400">
                (
                {[enableRotation && 'rotated', enableScale && 'scaled']
                  .filter(Boolean)
                  .join(' ')}
                )
              </span>
            )}
          </p>

          {/* Nested SpatialDiv test case */}
          <h2 className="text-lg mt-6">Nested SpatialDiv</h2>
          <div
            enable-xr
            style={nestedOuterStyle}
            className="rounded-lg cursor-pointer relative"
            onSpatialTap={evt => onSpatialTap(evt, 'outer (blue)')}
          >
            <span className="absolute top-1 left-1 text-xs text-white/80">
              Outer 300×300
            </span>
            <div
              enable-xr
              style={nestedInnerStyle}
              className="rounded-lg cursor-pointer relative"
              onSpatialTap={evt => onSpatialTap(evt, 'inner (red)')}
            >
              <span className="absolute top-1 left-1 text-xs text-white">
                Inner 150×150
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Blue outer (300×300) + Red inner (150×150, offset 30,30)
          </p>

          {/* Model tap test cases */}
          <h2 className="text-lg mt-6">Model tap</h2>
          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Plain</span>
              <Model
                src={MODEL_SRC}
                enable-xr
                style={{
                  width: '200px',
                  height: '200px',
                  '--xr-back': '10px',
                }}
                onSpatialTap={(evt: ModelSpatialTapEvent) =>
                  onSpatialTap(evt, 'model (plain)')
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">With translate</span>
              <Model
                src={MODEL_SRC}
                enable-xr
                style={{
                  width: '180px',
                  height: '180px',
                  '--xr-back': '8px',
                  transform: 'translate3d(80px, 20px, 0)',
                }}
                onSpatialTap={(evt: ModelSpatialTapEvent) =>
                  onSpatialTap(evt, 'model (translated)')
                }
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Tap the 3D model(s) — same log format (offsetX/Y/Z, clientX/Y/Z)
          </p>
        </div>

        <div className="flex-1 min-w-0 sticky top-4 self-start">
          <h2 className="text-lg mb-2">Tap Log</h2>
          <pre
            className="bg-black/50 p-4 rounded text-xs overflow-auto max-h-80 font-mono"
            data-testid="geometry-verify-log"
          >
            {logs.length ? logs.join('\n') : '(tap to see output)'}
          </pre>
          <button
            type="button"
            className="mt-2 px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
            onClick={() => setLogs([])}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800/50 rounded text-sm">
        <h3 className="font-semibold mb-2">Verification Criteria</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>
            <strong>offsetX/Y/Z</strong>: tap position in element local space
            (top-left origin; z=0 is the front face, so tapping the front face
            gives offsetZ ≈ 0 even when --xr-back is set)
          </li>
          <li>
            <strong>clientX/Y/Z</strong>: tap position in SpatialScene global
            space
          </li>
          <li>
            <strong>Rotation/Scale</strong>: enable checkboxes and tap —
            offsetX/Y should still be in element local space
          </li>
          <li>
            <strong>Nested SpatialDiv</strong>: tap outer (blue) and inner (red)
            — check offsetX/Y/Z and clientX/Y/Z for both
          </li>
          <li>
            <strong>Model tap</strong>: tap plain and translated 3D models —
            same offsetX/Y/Z and clientX/Y/Z log format
          </li>
        </ul>
      </div>
    </div>
  )
}
