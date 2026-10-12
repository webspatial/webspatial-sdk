import { useRef, useState, useCallback, useEffect } from 'react'
import { useAnimation } from '@webspatial/react-sdk/experimental'
import { SpatialElementMotionPageShell, btnPrimary } from './shared'

const ANIM_DURATION_MS = 2000
const TARGET = {
  translate: { x: 80, y: 40, z: 0 },
  scale: { x: 1.5, y: 1.5, z: 1.5 },
  rotate: { x: 0, y: 180, z: 45 },
}

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

type AnimMode = 'js' | 'declarative'
const COUNTS = [1, 10, 50, 100, 200]

// JS-driven animation box with continuous loop
function JSDrivenBox({ running }: { running: boolean }) {
  const divRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const directionRef = useRef<1 | -1>(1)

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current)
      if (divRef.current) {
        divRef.current.style.transform = ''
      }
      return
    }

    startRef.current = performance.now()
    directionRef.current = 1

    function tick() {
      const elapsed = performance.now() - startRef.current
      const rawT = elapsed / ANIM_DURATION_MS

      // Loop: ping-pong between 0 and 1
      const cycle = rawT % 2
      const t = cycle <= 1 ? cycle : 2 - cycle
      const e = easeInOut(t)

      if (divRef.current) {
        const tx = TARGET.translate.x * e
        const ty = TARGET.translate.y * e
        const tz = TARGET.translate.z * e
        const sx = 1 + (TARGET.scale.x - 1) * e
        const sy = 1 + (TARGET.scale.y - 1) * e
        const sz = 1 + (TARGET.scale.z - 1) * e
        const ry = TARGET.rotate.y * e
        const rz = TARGET.rotate.z * e
        divRef.current.style.transform = `translate3d(${tx}px, ${ty}px, ${tz}px) scale3d(${sx}, ${sy}, ${sz}) rotateY(${ry}deg) rotateZ(${rz}deg)`
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  return (
    <div
      ref={divRef}
      enable-xr
      style={{
        width: 24,
        height: 24,
        background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
        borderRadius: 4,
        margin: 2,
      }}
    />
  )
}

// Declarative animation box with reverse loop
function DeclarativeBox({ running }: { running: boolean }) {
  const [motion, api, style] = useAnimation({
    from: {
      transform: {
        translate: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotate: { x: 0, y: 0, z: 0 },
      },
    },
    to: {
      transform: {
        translate: TARGET.translate,
        scale: TARGET.scale,
        rotate: TARGET.rotate,
      },
    },
    duration: ANIM_DURATION_MS / 1000,
    timingFunction: 'easeInOut',
    loop: { reverse: true },
    autoStart: false,
  })

  useEffect(() => {
    if (running) {
      api.play()
    } else {
      api.reset()
    }
  }, [running, api])

  return (
    <div
      enable-xr
      xr-animation={motion}
      style={{
        width: 24,
        height: 24,
        background: 'linear-gradient(135deg, #1e5f3a, #2d8754)',
        borderRadius: 4,
        margin: 2,
        ...style,
      }}
    />
  )
}

export default function LoopAnimationPage() {
  const [mode, setMode] = useState<AnimMode>('declarative')
  const [count, setCount] = useState(50)
  const [running, setRunning] = useState(false)

  const handleRun = useCallback(() => {
    setRunning(true)
  }, [])

  const handleStop = useCallback(() => {
    setRunning(false)
  }, [])

  const isJsMode = mode === 'js'

  return (
    <SpatialElementMotionPageShell
      title="Loop Animation: JS-Driven vs Declarative"
      description={
        <>
          Choose animation mode (JS-driven or declarative), then click Run to
          start continuous loop animation. Click Stop to halt and reset.
          JS-driven uses rAF + manual lerp in a ping-pong loop; Declarative uses{' '}
          <code className="text-cyan-300">useAnimation</code> with{' '}
          <code className="text-cyan-300">loop: {'{ reverse: true }'}</code>.
          Increase instance count to observe performance differences.
        </>
      }
    >
      {/* Control bar */}
      <section className="mb-6 flex flex-wrap items-center gap-4">
        {/* Mode selector */}
        <label className="text-sm text-gray-300">
          Mode:
          <select
            className="ml-2 rounded bg-gray-800 px-3 py-1 text-white border border-gray-600"
            value={mode}
            onChange={e => {
              if (running) return
              setMode(e.target.value as AnimMode)
            }}
            disabled={running}
          >
            <option value="declarative">Declarative (useAnimation)</option>
            <option value="js">JS Driven (rAF + lerp)</option>
          </select>
        </label>

        {/* Instance count */}
        <label className="text-sm text-gray-300">
          Instances:
          <select
            className="ml-2 rounded bg-gray-800 px-3 py-1 text-white border border-gray-600"
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            disabled={running}
          >
            {COUNTS.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {/* Run / Stop buttons */}
        {!running ? (
          <button className={btnPrimary} onClick={handleRun}>
            Run
          </button>
        ) : (
          <button
            className="select-none px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition-colors"
            onClick={handleStop}
          >
            Stop
          </button>
        )}

        {/* Status indicator */}
        {running && (
          <span className="text-xs font-mono text-yellow-300">
            ● Looping ({isJsMode ? 'JS Driven' : 'Declarative'}, {count}{' '}
            instances)
          </span>
        )}
      </section>

      {/* Animation area */}
      <div
        className={`rounded-2xl border p-4 transition-opacity ${
          running
            ? isJsMode
              ? 'border-blue-500 bg-[#0a1628]'
              : 'border-green-500 bg-[#0a2816]'
            : 'border-gray-800 bg-[#111]/50 opacity-60'
        }`}
      >
        <h3
          className={`mb-2 text-sm font-semibold ${
            isJsMode ? 'text-blue-300' : 'text-green-300'
          }`}
        >
          {isJsMode ? 'JS Driven (rAF + lerp)' : 'Declarative (useAnimation)'}
          {running && (
            <span className="ml-2 text-xs text-yellow-300">● LOOPING</span>
          )}
        </h3>
        <div className="flex flex-wrap min-h-[120px]">
          {Array.from({ length: count }).map((_, i) =>
            isJsMode ? (
              <JSDrivenBox key={i} running={running} />
            ) : (
              <DeclarativeBox key={i} running={running} />
            ),
          )}
        </div>
      </div>

      {/* Info */}
      <p className="mt-4 text-xs text-gray-500">
        {isJsMode
          ? '* JS-driven mode: each instance runs its own requestAnimationFrame loop with manual transform interpolation. Performance degrades as instance count increases due to main thread workload.'
          : '* Declarative mode: animation runs natively via useAnimation with loop: { reverse: true }. Main thread stays free regardless of instance count.'}
      </p>
    </SpatialElementMotionPageShell>
  )
}
