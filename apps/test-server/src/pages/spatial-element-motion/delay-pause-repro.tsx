import { useAnimation } from '@webspatial/react-sdk'
import { useEffect, useRef, useState } from 'react'
import { SpatialDivAnimationPageShell, btnCls, btnPrimary, Log } from './shared'

/** Delay before the native animation is allowed to emit its first frame. */
const DELAY_MS = 1000

/** Active animation duration after the delay has completed. */
const DURATION_MS = 2000

/** Wall-clock offset used to pause while the animation is still delayed. */
const PAUSE_AT_MS = 400

/** Wall-clock offset used to resume before the delay has completed. */
const RESUME_AT_MS = 800

/** Expected start time when delay excludes the paused interval once. */
const EXPECTED_START_MS = DELAY_MS + (RESUME_AT_MS - PAUSE_AT_MS)

/** Expected complete time when active progress does not subtract pre-start pause time again. */
const EXPECTED_COMPLETE_MS = EXPECTED_START_MS + DURATION_MS

/** Native bug symptom: completion is late by the pause duration from the delay window. */
const BUGGY_COMPLETE_MS = EXPECTED_COMPLETE_MS + (RESUME_AT_MS - PAUSE_AT_MS)

/** Timing tolerance for classifying JS/native callback jitter. */
const RESULT_TOLERANCE_MS = 250

/** Visible verdict for the repro run. */
type ReproResult =
  | { kind: 'idle'; message: string }
  | { kind: 'running'; message: string }
  | { kind: 'pass'; message: string }
  | { kind: 'fail'; message: string }

/** Formats an elapsed millisecond value for compact test logs. */
function fmtMs(value: number) {
  return `${Math.round(value)}ms`
}

/** Classifies completion timing against the expected and known-bug clocks. */
function classifyCompleteTime(completedAtMs: number): ReproResult {
  const expectedDelta = Math.abs(completedAtMs - EXPECTED_COMPLETE_MS)
  const buggyDelta = Math.abs(completedAtMs - BUGGY_COMPLETE_MS)

  if (expectedDelta <= RESULT_TOLERANCE_MS && expectedDelta <= buggyDelta) {
    return {
      kind: 'pass',
      message: `PASS: completed at ${fmtMs(completedAtMs)}, matching expected ${EXPECTED_COMPLETE_MS}ms.`,
    }
  }

  return {
    kind: 'fail',
    message: `FAIL: completed at ${fmtMs(completedAtMs)}; expected ${EXPECTED_COMPLETE_MS}ms, bug signature ${BUGGY_COMPLETE_MS}ms.`,
  }
}

/** Test-server repro for native delay/pause clock accounting. */
export function SpatialElementMotionDelayPauseReproPage() {
  const startedAtRef = useRef<number | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [result, setResult] = useState<ReproResult>({
    kind: 'idle',
    message: 'Idle: click Run Repro.',
  })

  /** Appends one line to the visible repro log. */
  const log = (line: string) => setLines(prev => [...prev, line])

  /** Returns elapsed wall-clock time since the current repro run started. */
  const elapsed = () => {
    const startedAt = startedAtRef.current
    return startedAt === null ? 0 : performance.now() - startedAt
  }

  const [motion, api, style] = useAnimation({
    duration: DURATION_MS / 1000,
    delay: DELAY_MS / 1000,
    autoStart: false,
    timingFunction: 'linear',
    tracks: [
      {
        property: 'transform.translate.x',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION_MS / 1000, value: 220 },
        ],
      },
    ],
    onStart: () => {
      log(`onStart at ${fmtMs(elapsed())} (expected ~= ${EXPECTED_START_MS}ms)`)
    },
    onComplete: () => {
      const completedAtMs = elapsed()
      log(
        `onComplete at ${fmtMs(completedAtMs)} (expected ~= ${EXPECTED_COMPLETE_MS}ms; native bug ~= ${BUGGY_COMPLETE_MS}ms)`,
      )
      setResult(classifyCompleteTime(completedAtMs))
    },
    onReset: () => {
      log('onReset')
    },
    onError: error => {
      log(`onError ${error.reason}`)
    },
  })

  /** Clears pending repro timers so repeated runs do not overlap. */
  const clearTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []
  }

  /** Runs play -> pause during delay -> resume before delay completes. */
  const runRepro = () => {
    clearTimers()
    api.reset()
    setLines([])
    setResult({
      kind: 'running',
      message: 'Running: waiting for completion timing.',
    })
    startedAtRef.current = performance.now()
    log(
      `expected: start ~= ${EXPECTED_START_MS}ms, complete ~= ${EXPECTED_COMPLETE_MS}ms`,
    )
    log(`bug signal: native complete drifts toward ${BUGGY_COMPLETE_MS}ms`)
    api.play()
    log('play() at 0ms')

    timersRef.current = [
      setTimeout(() => {
        api.pause()
        log(`pause() at ${fmtMs(elapsed())}`)
      }, PAUSE_AT_MS),
      setTimeout(() => {
        api.play()
        log(`resume via play() at ${fmtMs(elapsed())}`)
      }, RESUME_AT_MS),
    ]
  }

  useEffect(
    () => () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    },
    [],
  )

  return (
    <SpatialDivAnimationPageShell
      title="Delay pause repro"
      description="Runs play, pauses inside the delay window, then resumes before delay completion. On native, the active animation currently finishes late by the paused delay duration."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 text-gray-200">
        <div
          enable-xr
          {...{ 'xr-animation': motion }}
          className="box mb-4 rounded-xl border-2 border-amber-500/60"
          style={{
            width: 180,
            height: 120,
            background: 'linear-gradient(135deg, #78350f 0%, #155e75 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span className="text-sm font-semibold text-white">
            Delay + pause
          </span>
        </div>

        <p className="mb-3 text-xs font-mono text-gray-500">
          playState={api.playState} · delay={DELAY_MS}ms · duration=
          {DURATION_MS}ms · pause={PAUSE_AT_MS}-{RESUME_AT_MS}ms
        </p>

        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
            result.kind === 'pass'
              ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
              : result.kind === 'fail'
                ? 'border-red-500/70 bg-red-950/50 text-red-200'
                : 'border-gray-700 bg-gray-900/60 text-gray-300'
          }`}
        >
          {result.message}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={runRepro}>
            Run Repro
          </button>
          <button type="button" className={btnCls} onClick={() => api.pause()}>
            Pause
          </button>
          <button type="button" className={btnCls} onClick={() => api.play()}>
            Resume
          </button>
          <button type="button" className={btnCls} onClick={() => api.reset()}>
            Reset
          </button>
        </div>

        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
