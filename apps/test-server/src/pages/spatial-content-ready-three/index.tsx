import { useCallback, useRef, useState } from 'react'
import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

import {
  enableDebugTool,
  type SpatialContentReadyContext,
} from '@webspatial/react-sdk'

enableDebugTool()

const DEPTH_OUTER = 120
const DEPTH_INNER = 100
const DEPTH_SINGLE = 110

type AttachOpts = {
  meshColor: number
}

function attachThreeToHost(ctx: SpatialContentReadyContext, opts: AttachOpts) {
  const { host } = ctx

  const scene = new Scene()
  scene.background = new Color(0x0a0a12)

  const camera = new PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 3

  const renderer = new WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const geometry = new BoxGeometry(1, 1, 1)
  const material = new MeshBasicMaterial({ color: opts.meshColor })
  const mesh = new Mesh(geometry, material)
  scene.add(mesh)

  host.appendChild(renderer.domElement)

  let raf = 0

  const layout = () => {
    const w = Math.max(host.clientWidth, 64)
    const h = Math.max(host.clientHeight, 64)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  layout()

  const animate = () => {
    raf = requestAnimationFrame(animate)
    mesh.rotation.x += 0.018
    mesh.rotation.y += 0.026
    renderer.render(scene, camera)
  }
  animate()

  const ro = new ResizeObserver(() => layout())
  ro.observe(host)

  return () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    const el = renderer.domElement
    if (el.parentNode === host) {
      host.removeChild(el)
    }
  }
}

const MAX_LOG = 28

export default function SpatialContentReadyThreePage() {
  const [readyEvents, setReadyEvents] = useState(0)
  const [cleanupEvents, setCleanupEvents] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const readySeq = useRef(0)
  const cleanupSeq = useRef(0)

  const [showMainPanel, setShowMainPanel] = useState(true)
  const [showNestedBlock, setShowNestedBlock] = useState(true)

  const outerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  const pushLine = useCallback((msg: string) => {
    setLines(prev => [...prev.slice(-(MAX_LOG - 1)), msg])
  }, [])

  const onOuterReady = useCallback(
    (ctx: SpatialContentReadyContext) => {
      readySeq.current += 1
      const n = readySeq.current
      setReadyEvents(n)
      const refOk = outerRef.current != null
      pushLine(
        `[outer ready #${n}] ref.current→${refOk ? 'set' : 'null'} host=${ctx.host.tagName} ${ctx.host.clientWidth}×${ctx.host.clientHeight}`,
      )

      const disposeThree = attachThreeToHost(ctx, { meshColor: 0x4488ff })

      return () => {
        disposeThree()
        cleanupSeq.current += 1
        const c = cleanupSeq.current
        setCleanupEvents(c)
        pushLine(`[outer cleanup #${c}]`)
      }
    },
    [pushLine],
  )

  const onInnerReady = useCallback(
    (ctx: SpatialContentReadyContext) => {
      readySeq.current += 1
      const n = readySeq.current
      setReadyEvents(n)
      const refOk = innerRef.current != null
      pushLine(
        `[inner ready #${n}] ref.current→${refOk ? 'set' : 'null'} host=${ctx.host.tagName} ${ctx.host.clientWidth}×${ctx.host.clientHeight}`,
      )

      const disposeThree = attachThreeToHost(ctx, { meshColor: 0x44ff88 })

      return () => {
        disposeThree()
        cleanupSeq.current += 1
        const c = cleanupSeq.current
        setCleanupEvents(c)
        pushLine(`[inner cleanup #${c}]`)
      }
    },
    [pushLine],
  )

  const onFlatReady = useCallback(
    (ctx: SpatialContentReadyContext) => {
      readySeq.current += 1
      const n = readySeq.current
      setReadyEvents(n)
      pushLine(
        `[single ready #${n}] host=${ctx.host.tagName} ${ctx.host.clientWidth}×${ctx.host.clientHeight}`,
      )
      const disposeThree = attachThreeToHost(ctx, { meshColor: 0xaa66ff })
      return () => {
        disposeThree()
        cleanupSeq.current += 1
        setCleanupEvents(cleanupSeq.current)
        pushLine(`[single cleanup #${cleanupSeq.current}]`)
      }
    },
    [pushLine],
  )

  const firstOuterReadyIndex = lines.findIndex(line =>
    line.startsWith('[outer ready'),
  )
  const firstInnerReadyIndex = lines.findIndex(line =>
    line.startsWith('[inner ready'),
  )
  const hasOuterReady = firstOuterReadyIndex >= 0
  const hasInnerReady = firstInnerReadyIndex >= 0
  const parentBeforeChild =
    hasOuterReady &&
    hasInnerReady &&
    firstOuterReadyIndex < firstInnerReadyIndex
  const refNeverNullOnReady = !lines.some(line =>
    line.includes('ref.current→null'),
  )
  const sawAnyCleanup = cleanupEvents > 0

  const renderStatus = (
    label: string,
    pass: boolean,
    waiting: boolean = false,
  ) => {
    const text = waiting ? 'WAITING' : pass ? 'PASS' : 'FAIL'
    const badgeClass = waiting
      ? 'bg-gray-500/25 text-gray-300 border-gray-400/40'
      : pass
        ? 'bg-green-500/25 text-green-300 border-green-400/40'
        : 'bg-red-500/25 text-red-300 border-red-400/40'
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-300">{label}</span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border ${badgeClass}`}
        >
          {text}
        </span>
      </div>
    )
  }

  return (
    <div className="p-6 text-white min-h-full bg-[#111118]">
      <h1 className="text-2xl mb-2 font-semibold">
        SpatialDiv · onSpatialContentReady · Three.js
      </h1>
      <p className="text-gray-400 text-sm mb-4 max-w-3xl">
        Canvas under <code className="text-cyan-300">ctx.host</code>. Nested
        block: expect <strong className="text-gray-200">outer ready</strong>{' '}
        before <strong className="text-gray-200">inner ready</strong> on first
        mount. Toggle panels to exercise cleanup / re-ready.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm border border-white/20"
          onClick={() => setShowMainPanel(s => !s)}
        >
          {showMainPanel ? 'Unmount' : 'Mount'} main panel (blue + nested)
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm border border-white/20"
          onClick={() => setShowNestedBlock(s => !s)}
          disabled={!showMainPanel}
        >
          {showNestedBlock ? 'Hide' : 'Show'} inner SpatialDiv (green)
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-violet-500/30 hover:bg-violet-500/45 text-sm border border-violet-400/40"
          onClick={() => setLines([])}
        >
          Clear log
        </button>
      </div>

      <div className="flex flex-wrap gap-8 items-start">
        <div className="space-y-4">
          {showMainPanel && (
            <div
              ref={outerRef}
              enable-xr
              onSpatialContentReady={onOuterReady}
              className="rounded-xl overflow-hidden border border-white/15 shadow-lg flex flex-col"
              style={{
                width: 'min(92vw, 560px)',
                minHeight: '320px',
                '--xr-background-material': 'thin',
                '--xr-back': DEPTH_OUTER,
              }}
            >
              <div className="text-[11px] text-gray-500 px-2 py-1 border-b border-white/10 shrink-0">
                Outer SpatialDiv · blue cube
              </div>
              {showNestedBlock && (
                <div className="p-3 flex justify-center shrink-0">
                  <div
                    ref={innerRef}
                    enable-xr
                    onSpatialContentReady={onInnerReady}
                    className="rounded-lg overflow-hidden border border-emerald-500/40 shadow-inner"
                    style={{
                      width: '72%',
                      height: '140px',
                      '--xr-background-material': 'thin',
                      '--xr-back': DEPTH_INNER,
                    }}
                  >
                    <div className="text-[10px] text-emerald-400/80 px-2 py-0.5 border-b border-emerald-500/20">
                      Inner SpatialDiv · green cube
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 max-w-[560px]">
            Purple panel stays mounted when you unmount the blue+nested block —
            compare single vs nested lifecycle.
          </p>
          <div
            enable-xr
            onSpatialContentReady={onFlatReady}
            className="rounded-xl overflow-hidden border border-violet-400/25 shadow-lg"
            style={{
              width: 'min(92vw, 400px)',
              height: '140px',
              '--xr-background-material': 'thin',
              '--xr-back': DEPTH_SINGLE,
            }}
          >
            <div className="text-[11px] text-violet-300/70 px-2 py-1 border-b border-white/10">
              Single SpatialDiv · purple cube (always mounted on this page)
            </div>
          </div>
        </div>

        <div className="text-sm space-y-2 font-mono text-gray-300 min-w-[280px] flex-1 max-w-xl">
          <div className="flex gap-4 flex-wrap">
            <span>
              ready edge: <span className="text-green-400">{readyEvents}</span>
            </span>
            <span>
              cleanup: <span className="text-amber-400">{cleanupEvents}</span>
            </span>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Acceptance checks
            </div>
            {renderStatus('Outer ready fired', hasOuterReady, !hasOuterReady)}
            {renderStatus(
              'Inner ready fired (toggle inner once)',
              hasInnerReady,
              !hasInnerReady,
            )}
            {renderStatus(
              'Nested order: outer ready before inner ready',
              parentBeforeChild,
              !(hasOuterReady && hasInnerReady),
            )}
            {renderStatus(
              'Ready callback sees non-null ref.current',
              refNeverNullOnReady,
            )}
            {renderStatus(
              'Cleanup observed (toggle main panel once)',
              sawAnyCleanup,
              !sawAnyCleanup,
            )}
          </div>
          <div className="text-[11px] text-gray-500">
            Current depth: outer {DEPTH_OUTER}, inner {DEPTH_INNER}, single{' '}
            {DEPTH_SINGLE}. Lower values make overlap easier to inspect.
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-3">
            Event log (newest at bottom)
          </div>
          <ul className="text-[11px] leading-snug space-y-1 max-h-[min(52vh,520px)] overflow-y-auto bg-black/25 rounded-lg p-3 border border-white/10">
            {lines.length === 0 ? (
              <li className="text-gray-600">No events yet.</li>
            ) : (
              lines.map((line, i) => (
                <li key={`${i}-${line.slice(0, 32)}`}>{line}</li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
