import { useCallback, useState } from 'react'
import { useAnimation, enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

// ─── Shared Utilities ─────────────────────────────────────────────────────────

const btnCls =
  'select-none px-4 py-2 text-sm font-semibold rounded-lg border border-gray-600 text-gray-200 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors'

const btnPrimary =
  'select-none px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition-colors'

function useLog() {
  const [lines, setLines] = useState<string[]>([])
  const log = useCallback(
    (msg: string) =>
      setLines(prev => [
        ...prev.slice(-99),
        `[${new Date().toLocaleTimeString()}] ${msg}`,
      ]),
    [],
  )
  const clear = useCallback(() => setLines([]), [])
  return { lines, log, clear }
}

function Log({ lines }: { lines: string[] }) {
  return (
    <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-black/40 border border-gray-800 p-3 text-xs font-mono text-gray-400">
      {lines.length === 0 && (
        <span className="text-gray-600">No events yet</span>
      )}
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  )
}

// ─── Test 1: Fade-In Entrance (autoStart) ─────────────────────────────────────

function FadeInEntranceTest() {
  const { lines, log, clear } = useLog()

  const [animation] = useAnimation({
    from: { back: -50, opacity: 0 },
    to: { back: 0, opacity: 1 },
    duration: 0.6,
    timingFunction: 'easeOut',
    onStart: () => log('fadeIn: onStart'),
    onComplete: (values: any) =>
      log(
        `fadeIn: onComplete → back=${values.back?.toFixed(1)} opacity=${values.opacity?.toFixed(2)}`,
      ),
    onError: (err: any) => log(`fadeIn: onError → ${err.reason}`),
  } as any)

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-5">
      <h2 className="text-lg font-semibold text-gray-100 mb-2">
        1. Fade-In Entrance (autoStart)
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Back offset -50→0 and opacity 0→1 with easeOut over 0.6s. Auto-starts on
        element bind.
      </p>

      <div
        enable-xr
        animation={animation}
        style={{
          width: 300,
          height: 150,
          background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
          Hello Spatial
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>
      <Log lines={lines} />
    </section>
  )
}

// ─── Test 2: Manual Size Expand + Cancel ──────────────────────────────────────

function SizeExpandTest() {
  const { lines, log, clear } = useLog()
  const [size, setSize] = useState({ width: 200, height: 120 })

  const [animation, api] = useAnimation({
    to: { width: 400, height: 240 },
    duration: 1.0,
    autoStart: false,
    timingFunction: 'easeInOut',
    onStart: () => log('size: onStart'),
    onComplete: (values: any) =>
      log(
        `size: onComplete → w=${values.width?.toFixed(0)} h=${values.height?.toFixed(0)}`,
      ),
    onCancel: (values: any) => {
      log(
        `size: onCancel → w=${values.width?.toFixed(0)} h=${values.height?.toFixed(0)}`,
      )
      if (values.width != null && values.height != null) {
        setSize({ width: values.width, height: values.height })
      }
    },
    onError: (err: any) => log(`size: onError → ${err.reason}`),
  } as any)

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-5">
      <h2 className="text-lg font-semibold text-gray-100 mb-2">
        2. Manual Size Expand + Cancel Sync
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Width 200→400, height 120→240 over 1s. Manual trigger. Cancel restores
        and syncs React state.
      </p>

      <div
        enable-xr
        animation={animation}
        style={{
          width: size.width,
          height: size.height,
          background: 'linear-gradient(135deg, #3a1e5f, #5a2d87)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'none',
        }}
      >
        <span style={{ color: 'white', fontSize: 14 }}>
          {size.width}×{size.height}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button className={btnPrimary} onClick={() => (api as any).play()}>
          Play (Expand)
        </button>
        <button className={btnCls} onClick={() => (api as any).pause()}>
          Pause
        </button>
        <button className={btnCls} onClick={() => (api as any).play()}>
          Resume
        </button>
        <button className={btnCls} onClick={() => (api as any).cancel()}>
          Cancel
        </button>
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        playState:{' '}
        <code className="text-cyan-300">{(api as any).playState}</code>
      </div>
      <Log lines={lines} />
    </section>
  )
}

// ─── Test 3: Opacity Fade ─────────────────────────────────────────────────────

function OpacityFadeTest() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { opacity: 1.0 },
    to: { opacity: 0.2 },
    duration: 0.8,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('opacity: onStart'),
    onComplete: (values: any) =>
      log(`opacity: onComplete → opacity=${values.opacity?.toFixed(2)}`),
    onCancel: (values: any) =>
      log(`opacity: onCancel → opacity=${values.opacity?.toFixed(2)}`),
    onError: (err: any) => log(`opacity: onError → ${err.reason}`),
  } as any)

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-5">
      <h2 className="text-lg font-semibold text-gray-100 mb-2">
        3. Opacity Fade
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Opacity 1.0→0.2 over 0.8s with easeInOut. Uses{' '}
        <code className="text-cyan-300">useAnimation</code> — auto-dispatches to
        SpatialDiv path since <code>opacity</code> is a SpatialDiv key.
      </p>

      <div
        enable-xr
        animation={animation}
        style={{
          width: 250,
          height: 150,
          background: 'linear-gradient(135deg, #1e5f3a, #2d8754)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'white', fontSize: 16 }}>Fade Me</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button className={btnPrimary} onClick={() => (api as any).play()}>
          Play
        </button>
        <button className={btnCls} onClick={() => (api as any).pause()}>
          Pause
        </button>
        <button className={btnCls} onClick={() => (api as any).play()}>
          Resume
        </button>
        <button className={btnCls} onClick={() => (api as any).cancel()}>
          Cancel
        </button>
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        playState:{' '}
        <code className="text-cyan-300">{(api as any).playState}</code>
      </div>
      <Log lines={lines} />
    </section>
  )
}

// ─── Test 4: Combined + Delay ─────────────────────────────────────────────────

function CombinedDelayTest() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { width: 200, height: 120, opacity: 0.3, depth: 0 },
    to: { width: 350, height: 200, opacity: 1.0, depth: 60 },
    duration: 1.2,
    delay: 0.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('combined: onStart (after 500ms delay)'),
    onComplete: (values: any) =>
      log(
        `combined: onComplete → w=${values.width?.toFixed(0)} h=${values.height?.toFixed(0)} o=${values.opacity?.toFixed(2)} d=${values.depth?.toFixed(0)}`,
      ),
    onCancel: (values: any) =>
      log(
        `combined: onCancel → w=${values.width?.toFixed(0)} o=${values.opacity?.toFixed(2)}`,
      ),
    onError: (err: any) => log(`combined: onError → ${err.reason}`),
  } as any)

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-5">
      <h2 className="text-lg font-semibold text-gray-100 mb-2">
        4. Combined Properties + 500ms Delay
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Animates width, height, opacity, and depth simultaneously. Starts after
        500ms delay. Duration 1.2s.
      </p>

      <div
        enable-xr
        animation={animation}
        style={{
          width: 200,
          height: 120,
          background: 'linear-gradient(135deg, #5f3a1e, #874d2d)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'white', fontSize: 14 }}>Combined</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button className={btnPrimary} onClick={() => (api as any).play()}>
          Play
        </button>
        <button className={btnCls} onClick={() => (api as any).pause()}>
          Pause
        </button>
        <button className={btnCls} onClick={() => (api as any).play()}>
          Resume
        </button>
        <button className={btnCls} onClick={() => (api as any).cancel()}>
          Cancel
        </button>
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        playState:{' '}
        <code className="text-cyan-300">{(api as any).playState}</code>
      </div>
      <Log lines={lines} />
    </section>
  )
}

// ─── Test 5: Playback Rate (2x speed) ────────────────────────────────────────

function PlaybackRateTest() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { width: 150, opacity: 1.0 },
    to: { width: 450, opacity: 0.4 },
    duration: 2.0,
    timingFunction: 'linear',
    playbackRate: 2.0,
    autoStart: false,
    onStart: () => log('rate: onStart (2x speed, effective 1s)'),
    onComplete: (values: any) =>
      log(
        `rate: onComplete → w=${values.width?.toFixed(0)} o=${values.opacity?.toFixed(2)}`,
      ),
    onError: (err: any) => log(`rate: onError → ${err.reason}`),
  } as any)

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-5">
      <h2 className="text-lg font-semibold text-gray-100 mb-2">
        5. Playback Rate (2× speed)
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Width 150→450 + opacity 1→0.4 over 2s at 2× speed (effective 1s). Linear
        easing.
      </p>

      <div
        enable-xr
        animation={animation}
        style={{
          width: 150,
          height: 100,
          background: 'linear-gradient(135deg, #5f1e4a, #872d6a)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'white', fontSize: 14 }}>2× Speed</span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button className={btnPrimary} onClick={() => (api as any).play()}>
          Play
        </button>
        <button className={btnCls} onClick={() => (api as any).cancel()}>
          Cancel
        </button>
        <button className={btnCls} onClick={clear}>
          Clear Log
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        playState:{' '}
        <code className="text-cyan-300">{(api as any).playState}</code>
      </div>
      <Log lines={lines} />
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpatialDivAnimationPage() {
  return (
    <div className="min-h-full bg-[#0d0d0d] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold">SpatialDiv Animation (POC)</h1>
        <p className="mb-2 max-w-3xl text-sm text-gray-400">
          Test page for SpatialDiv animation via{' '}
          <code className="text-cyan-300">useAnimation</code> +{' '}
          <code className="text-cyan-300">
            {'<div enable-xr animation={...}>'}
          </code>
          . The hook auto-dispatches to the SpatialDiv path based on{' '}
          <code>to</code> key set (opacity, width, height, depth, back).
        </p>
        <p className="mb-8 max-w-3xl text-xs text-gray-500">
          Requires the WebSpatial visionOS runtime with{' '}
          <code>AnimateSpatialized2DElement</code> JSB command support. In a
          regular browser, the <code>enable-xr</code> div renders as a normal
          div; callbacks and state transitions remain testable.
        </p>

        <div className="space-y-6">
          <FadeInEntranceTest />
          <SizeExpandTest />
          <OpacityFadeTest />
          <CombinedDelayTest />
          <PlaybackRateTest />
        </div>

        <section className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
          <h3 className="mb-2 font-medium text-gray-400">
            Manual verification checklist (visionOS)
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Entrance: card fades in from back=-50/opacity=0 to rest position
              on mount.
            </li>
            <li>
              Size expand: div grows from 200×120 to 400×240; cancel restores
              original size.
            </li>
            <li>
              Opacity: element fades from 1.0 to 0.2; pause freezes mid-fade.
            </li>
            <li>
              Combined: after 500ms delay, width/height/opacity/depth animate
              simultaneously.
            </li>
            <li>Playback rate: 2× speed completes a 2s animation in ~1s.</li>
            <li>
              Suppression: during animation, DOM sync does not overwrite
              animated properties (no visual jumps).
            </li>
            <li>
              All lifecycle callbacks (onStart, onComplete, onCancel, onError)
              appear in the log panel.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
