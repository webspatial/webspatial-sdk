import { useRef, useState, useCallback, useEffect } from 'react'
import { useAnimation } from '@webspatial/react-sdk'
import { SpatialDivAnimationPageShell, btnPrimary, btnCls } from './shared'

// --- Animation target values (shared between JS-driven and declarative) ---
const ANIM_DURATION_MS = 5000
const TARGET = {
  translate: { x: 80, y: 40, z: 0 },
  scale: { x: 1.5, y: 1.5, z: 1.5 },
  rotate: { x: 0, y: 180, z: 45 },
}

// --- Easing: cubic ease-in-out ---
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// --- FPS metrics ---
type Metrics = {
  avgFps: number
  minFps: number
  frameDrops: number
}

function computeMetrics(frameTimes: number[]): Metrics | null {
  if (frameTimes.length < 2) return null
  const deltas: number[] = []
  for (let i = 1; i < frameTimes.length; i++) {
    deltas.push(frameTimes[i] - frameTimes[i - 1])
  }
  const fps = deltas.map(d => (d > 0 ? 1000 / d : 0))
  const avgFps = fps.reduce((a, b) => a + b, 0) / fps.length
  // Min FPS: sliding window of 3 frames
  let minFps = Infinity
  for (let i = 0; i <= fps.length - 3; i++) {
    const windowAvg = (fps[i] + fps[i + 1] + fps[i + 2]) / 3
    if (windowAvg < minFps) minFps = windowAvg
  }
  if (minFps === Infinity) minFps = Math.min(...fps)
  // Frame drops: delta > 2x median
  const sorted = [...deltas].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const frameDrops = deltas.filter(d => d > median * 2).length
  return { avgFps, minFps, frameDrops }
}

// --- FPS bar chart (horizontal bars showing per-frame FPS) ---
function FpsBarChart({
  jsDeltas,
  declDeltas,
}: {
  jsDeltas: number[]
  declDeltas: number[]
}) {
  const maxFps = 90 // cap display at 90fps
  const toFps = (delta: number) =>
    delta > 0 ? Math.min(1000 / delta, maxFps) : 0
  const jsFps = jsDeltas.map(toFps)
  const declFps = declDeltas.map(toFps)
  const maxLen = Math.max(jsFps.length, declFps.length)
  // Show max 300 bars, sample if needed
  const step = maxLen > 300 ? Math.ceil(maxLen / 300) : 1
  const sample = (arr: number[]) => {
    const out: number[] = []
    for (let i = 0; i < arr.length; i += step) out.push(arr[i])
    return out
  }
  const jsS = sample(jsFps)
  const declS = sample(declFps)

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-gray-400 mb-2">
        Per-frame FPS (bar = one frame)
      </h4>
      <div className="mb-3">
        <div className="text-xs text-blue-300 mb-1">JS Driven</div>
        <div className="flex items-end gap-px h-16 bg-black/30 rounded overflow-hidden">
          {jsS.map((fps, i) => (
            <div
              key={i}
              className="bg-blue-500"
              style={{
                height: `${(fps / maxFps) * 100}%`,
                flex: '1 1 0',
                minWidth: 1,
              }}
              title={`Frame ${i * step}: ${fps.toFixed(1)} fps`}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-green-300 mb-1">Declarative</div>
        <div className="flex items-end gap-px h-16 bg-black/30 rounded overflow-hidden">
          {declS.map((fps, i) => (
            <div
              key={i}
              className="bg-green-500"
              style={{
                height: `${(fps / maxFps) * 100}%`,
                flex: '1 1 0',
                minWidth: 1,
              }}
              title={`Frame ${i * step}: ${fps.toFixed(1)} fps`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>0 fps</span>
        <span>{maxFps} fps</span>
      </div>
    </div>
  )
}

// --- JS-driven animation box (rAF + manual lerp) ---
function JSDrivenBox({ running }: { running: boolean }) {
  const divRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now()

    function tick() {
      const elapsed = performance.now() - startRef.current
      const t = Math.min(elapsed / ANIM_DURATION_MS, 1)
      const e = easeInOut(t)
      // Apply interpolated transform (this is the per-frame JS work)
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
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Animation complete — reset to initial state
        if (divRef.current) {
          divRef.current.style.transform = ''
        }
      }
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

// --- Declarative animation box (useAnimation API) ---
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
    autoStart: false,
  })

  useEffect(() => {
    if (running) {
      api.play()
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

// --- Main page ---
type Phase = 'idle' | 'js' | 'gap' | 'decl' | 'done'
const COUNTS = [1, 10, 50, 100, 200]

export default function PerfComparisonPage() {
  const [count, setCount] = useState(50)
  const [phase, setPhase] = useState<Phase>('idle')
  const [jsMetrics, setJsMetrics] = useState<Metrics | null>(null)
  const [declMetrics, setDeclMetrics] = useState<Metrics | null>(null)
  const [jsDeltas, setJsDeltas] = useState<number[]>([])
  const [declDeltas, setDeclDeltas] = useState<number[]>([])

  // FPS monitoring
  const frameTimes = useRef<number[]>([])
  const jsFrameTimesSnapshot = useRef<number[]>([])
  const monitorRaf = useRef<number>(0)
  const phaseStartTime = useRef<number>(0)

  // Start FPS monitor for a given duration, then call onDone with results
  const startMonitor = useCallback((onDone: (m: Metrics | null) => void) => {
    frameTimes.current = []
    phaseStartTime.current = performance.now()

    function monitor() {
      const now = performance.now()
      frameTimes.current.push(now)
      if (now - phaseStartTime.current < ANIM_DURATION_MS + 100) {
        monitorRaf.current = requestAnimationFrame(monitor)
      } else {
        onDone(computeMetrics(frameTimes.current))
      }
    }
    monitorRaf.current = requestAnimationFrame(monitor)
  }, [])

  const run = useCallback(() => {
    setJsMetrics(null)
    setDeclMetrics(null)
    setJsDeltas([])
    setDeclDeltas([])

    // Phase 1: Run JS-driven side
    setPhase('js')
    startMonitor(jsResult => {
      jsFrameTimesSnapshot.current = [...frameTimes.current]
      setJsMetrics(jsResult)
      // Store frame deltas for chart
      const jsTimes = jsFrameTimesSnapshot.current
      setJsDeltas(jsTimes.slice(1).map((t, i) => +(t - jsTimes[i]).toFixed(2)))
      // Brief gap between runs
      setPhase('gap')
      setTimeout(() => {
        // Phase 2: Run declarative side
        setPhase('decl')
        startMonitor(declResult => {
          setDeclMetrics(declResult)
          // Store frame deltas for chart
          const declTimes = [...frameTimes.current]
          setDeclDeltas(
            declTimes.slice(1).map((t, i) => +(t - declTimes[i]).toFixed(2)),
          )
          setPhase('done')
          // Print results to console for easy copying
          console.table({
            'JS Driven': jsResult,
            Declarative: declResult,
          })
          // Output per-frame deltas (ms) for detailed analysis
          const toDeltas = (times: number[]) =>
            times.slice(1).map((t, i) => +(t - times[i]).toFixed(2))
          console.log(
            '[Perf] JS Driven frame deltas (ms):',
            toDeltas(jsFrameTimesSnapshot.current),
          )
          console.log(
            '[Perf] Declarative frame deltas (ms):',
            toDeltas([...frameTimes.current]),
          )
        })
      }, 500)
    })
  }, [startMonitor])

  const reset = useCallback(() => {
    cancelAnimationFrame(monitorRaf.current)
    setPhase('idle')
    setJsMetrics(null)
    setDeclMetrics(null)
    setJsDeltas([])
    setDeclDeltas([])
  }, [])

  const jsRunning = phase === 'js'
  const declRunning = phase === 'decl'

  return (
    <SpatialDivAnimationPageShell
      title="Perf Comparison: JS-Driven vs Declarative"
      description={
        <>
          Sequential benchmark: first runs JS-driven (rAF + lerp) animation,
          then runs declarative (
          <code className="text-cyan-300">useAnimation</code>) animation. Each
          phase independently measures FPS via rAF interval. Increase instance
          count to see JS-driven FPS degrade while declarative stays stable.
        </>
      }
    >
      {/* Control bar */}
      <section className="mb-6 flex flex-wrap items-center gap-4">
        <label className="text-sm text-gray-300">
          Instances:
          <select
            className="ml-2 rounded bg-gray-800 px-3 py-1 text-white border border-gray-600"
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            disabled={phase !== 'idle' && phase !== 'done'}
          >
            {COUNTS.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          className={btnPrimary}
          onClick={run}
          disabled={phase !== 'idle' && phase !== 'done'}
        >
          {phase === 'idle' || phase === 'done' ? 'Run' : 'Running…'}
        </button>
        <button className={btnCls} onClick={reset} disabled={phase === 'idle'}>
          Reset
        </button>
        {/* Phase indicator */}
        {phase !== 'idle' && phase !== 'done' && (
          <span className="text-xs font-mono text-yellow-300">
            {phase === 'js' && '▶ Phase 1/2: JS Driven'}
            {phase === 'gap' && '⏸ Waiting…'}
            {phase === 'decl' && '▶ Phase 2/2: Declarative'}
          </span>
        )}
      </section>

      {/* Animation areas — show active phase */}
      <div className="grid grid-cols-2 gap-4">
        {/* JS Driven side */}
        <div
          className={`rounded-2xl border p-4 transition-opacity ${
            jsRunning
              ? 'border-blue-500 bg-[#0a1628]'
              : 'border-gray-800 bg-[#0a1628]/50 opacity-60'
          }`}
        >
          <h3 className="mb-2 text-sm font-semibold text-blue-300">
            JS Driven (rAF + lerp)
            {jsRunning && (
              <span className="ml-2 text-xs text-yellow-300">● ACTIVE</span>
            )}
          </h3>
          <div className="flex flex-wrap min-h-[120px]">
            {Array.from({ length: count }).map((_, i) => (
              <JSDrivenBox key={i} running={jsRunning} />
            ))}
          </div>
        </div>

        {/* Declarative side */}
        <div
          className={`rounded-2xl border p-4 transition-opacity ${
            declRunning
              ? 'border-green-500 bg-[#0a2816]'
              : 'border-gray-800 bg-[#0a2816]/50 opacity-60'
          }`}
        >
          <h3 className="mb-2 text-sm font-semibold text-green-300">
            Declarative (useAnimation)
            {declRunning && (
              <span className="ml-2 text-xs text-yellow-300">● ACTIVE</span>
            )}
          </h3>
          <div className="flex flex-wrap min-h-[120px]">
            {Array.from({ length: count }).map((_, i) => (
              <DeclarativeBox key={i} running={declRunning} />
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {(jsMetrics || declMetrics) && (
        <section className="mt-6 rounded-2xl border border-gray-800 bg-[#111] p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-200">
            Results ({count} instances, {ANIM_DURATION_MS}ms duration)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="py-2 pr-4">Metric</th>
                  <th className="py-2 pr-4 text-blue-300">JS Driven</th>
                  <th className="py-2 text-green-300">Declarative</th>
                </tr>
              </thead>
              <tbody className="text-gray-200 font-mono">
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4 text-gray-400">Avg FPS</td>
                  <td className="py-2 pr-4">
                    {jsMetrics?.avgFps.toFixed(1) ?? '-'}
                  </td>
                  <td className="py-2">
                    {declMetrics?.avgFps.toFixed(1) ?? '-'}
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4 text-gray-400">
                    Min FPS (3-frame window)
                  </td>
                  <td className="py-2 pr-4">
                    {jsMetrics?.minFps.toFixed(1) ?? '-'}
                  </td>
                  <td className="py-2">
                    {declMetrics?.minFps.toFixed(1) ?? '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-400">Frame Drops</td>
                  <td className="py-2 pr-4">{jsMetrics?.frameDrops ?? '-'}</td>
                  <td className="py-2">{declMetrics?.frameDrops ?? '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {jsDeltas.length > 0 && declDeltas.length > 0 && (
            <FpsBarChart jsDeltas={jsDeltas} declDeltas={declDeltas} />
          )}
          <p className="mt-3 text-xs text-gray-500">
            * FPS estimated via rAF callback interval. JS-driven side degrades
            as instance count increases because each div's rAF lerp + DOM write
            occupies main thread time. Declarative side offloads animation to
            native — main thread stays free.
          </p>
        </section>
      )}
    </SpatialDivAnimationPageShell>
  )
}
