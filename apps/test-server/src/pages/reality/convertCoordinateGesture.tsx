import { convertCoordinate } from '@webspatial/react-sdk'
import { useRef, useState } from 'react'

type Check = {
  offset: { x: number; y: number; z: number }
  client: { x: number; y: number; z: number }
  toWindow: { x: number; y: number; z: number }
  backToLocal: { x: number; y: number; z: number }
  forwardError: number
  reverseError: number
}

function distance(a: Check['offset'], b: Check['offset']) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function formatted(value: Check['offset']) {
  return `(${value.x.toFixed(4)}, ${value.y.toFixed(4)}, ${value.z.toFixed(4)})`
}

export default function ConvertCoordinateGesture() {
  const targetRef = useRef<HTMLDivElement>(null)
  const [check, setCheck] = useState<Check | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pass =
    check != null && check.forwardError <= 0.5 && check.reverseError <= 0.5

  return (
    <div className="min-h-full p-8 text-white">
      <h1 className="mb-2 text-2xl font-bold">
        convertCoordinate Gesture Round Trip
      </h1>
      <p className="mb-6 max-w-3xl text-sm text-gray-300">
        Tap the purple SpatialDiv. It has a non-center transform-origin plus
        rotate, non-uniform scale, translate3d, and --xr-back. The check maps
        tap.offset to window and tap.client back to the SpatialDiv.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-gray-700 bg-[#111]">
          <div
            ref={targetRef}
            enable-xr
            data-name="Convert Coordinate CSS Transform Target"
            onSpatialTap={async event => {
              if (!targetRef.current) return
              try {
                const offset = {
                  x: event.offsetX,
                  y: event.offsetY,
                  z: event.offsetZ,
                }
                const client = {
                  x: event.clientX,
                  y: event.clientY,
                  z: event.clientZ,
                }
                const toWindow = await convertCoordinate(offset, {
                  from: targetRef.current,
                  to: window,
                })
                const backToLocal = await convertCoordinate(client, {
                  from: window,
                  to: targetRef.current,
                })
                setCheck({
                  offset,
                  client,
                  toWindow,
                  backToLocal,
                  forwardError: distance(toWindow, client),
                  reverseError: distance(backToLocal, offset),
                })
                setError(null)
              } catch (reason) {
                setError(
                  reason instanceof Error ? reason.message : String(reason),
                )
              }
            }}
            style={{
              width: '220px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '24px',
              background: '#9333ea',
              color: 'white',
              fontWeight: 700,
              transformOrigin: '25% 70%',
              transform:
                'rotate(25deg) scale3d(1.2, 0.8, 1.4) translate3d(15px, -10px, 20px)',
              '--xr-back': 90,
              '--xr-background-material': 'thin',
            }}
          >
            TAP TO VERIFY
          </div>
        </div>

        <section className="rounded-xl border border-gray-700 bg-[#171717] p-5 text-sm">
          <div
            data-testid="convert-coordinate-verdict"
            data-status={check == null ? 'waiting' : pass ? 'pass' : 'fail'}
            className="rounded-lg border border-gray-700 bg-black/30 p-4"
          >
            <h2 className="mb-3 text-lg font-semibold">
              Result: {check == null ? 'WAITING' : pass ? 'PASS' : 'FAIL'}
            </h2>
            {check ? (
              <div className="space-y-2 font-mono text-xs">
                <div>tap.offset: {formatted(check.offset)}</div>
                <div>tap.client: {formatted(check.client)}</div>
                <div>offset → window: {formatted(check.toWindow)}</div>
                <div>window → local: {formatted(check.backToLocal)}</div>
                <div>forward error: {check.forwardError.toFixed(6)} px</div>
                <div>reverse error: {check.reverseError.toFixed(6)} px</div>
              </div>
            ) : (
              <div className="text-gray-400">Waiting for a spatial tap.</div>
            )}
            {error && <div className="mt-3 text-red-400">{error}</div>}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            PASS requires both directions to agree with the gesture coordinates
            within 0.5 CSS px.
          </p>
        </section>
      </div>
    </div>
  )
}
