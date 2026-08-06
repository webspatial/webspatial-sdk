import { useState } from 'react'
import { useAnimation } from '@webspatial/react-sdk/experimental'
import {
  SpatialElementMotionPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  fmtValues,
  useLog,
} from './shared'

/**
 * Nested Spatial Element Animation Test
 *
 * Verifies that independent animations on nested enable-xr divs
 * (parent / child / grandchild) work correctly:
 * - Each layer runs its own animation session independently
 * - Pause/reset on one layer does NOT affect others
 * - Suppression is isolated per element
 * - Lifecycle callbacks fire independently per layer
 * - Unmounting a middle layer resets its animation + unmounts children,
 *   while the outer layer continues unaffected
 */

// ─── Inner (Grandchild) ─────────────────────────────────────────────────────

function InnerLayer({ log }: { log: (msg: string) => void }) {
  const [key, setKey] = useState(0)

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold text-purple-300">
          Inner (Grandchild)
        </span>
        <button className={btnCls} onClick={() => setKey(prev => prev + 1)}>
          Remount
        </button>
      </div>
      <InnerScene key={key} log={log} />
    </div>
  )
}

function InnerScene({ log }: { log: (msg: string) => void }) {
  const [motion, api, style] = useAnimation({
    from: {
      transform: { scale: { x: 0.6, y: 0.6, z: 0.6 } },
      opacity: 0,
    },
    to: {
      transform: { scale: { x: 1.2, y: 1.2, z: 1.2 } },
      opacity: 1,
    },
    duration: 1.0,
    timingFunction: 'easeIn',
    onStart: () => log('[inner] onStart'),
    onComplete: values => log(`[inner] onComplete → ${fmtValues(values)}`),
    onReset: values => log(`[inner] onReset → ${fmtValues(values)}`),
    onError: err => log(`[inner] onError → ${err.reason}`),
  })

  return (
    <div>
      <div
        enable-xr
        xr-animation={motion}
        style={{
          width: 120,
          height: 80,
          background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
          Inner
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <PlayStateBadge state={api.playState} />
        <span className="text-xs font-mono text-gray-500">
          isAnimating={String(api.isAnimating)}
        </span>
      </div>
    </div>
  )
}

// ─── Middle (Child) ──────────────────────────────────────────────────────────

function MiddleLayer({ log }: { log: (msg: string) => void }) {
  const [motion, api, style] = useAnimation({
    from: {
      transform: { rotate: { z: 0 } },
    },
    to: {
      transform: { rotate: { z: 180 } },
    },
    duration: 1.5,
    timingFunction: 'easeOut',
    autoStart: false,
    onStart: () => log('[middle] onStart'),
    onComplete: values => log(`[middle] onComplete → ${fmtValues(values)}`),
    onReset: values => log(`[middle] onReset → ${fmtValues(values)}`),
    onError: err => log(`[middle] onError → ${err.reason}`),
  })

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold text-green-300">Middle (Child)</span>
        <button className={btnPrimary} onClick={() => api.play()}>
          Play
        </button>
        <button className={btnCls} onClick={() => api.pause()}>
          Pause
        </button>
        <button className={btnCls} onClick={() => api.play()}>
          Resume
        </button>
        <button className={btnCls} onClick={() => api.reset()}>
          Reset
        </button>
        <PlayStateBadge state={api.playState} />
      </div>
      <div
        enable-xr
        xr-animation={motion}
        style={{
          width: 300,
          height: 180,
          padding: 16,
          background: 'linear-gradient(135deg, #065f46, #047857)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          ...style,
        }}
      >
        <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
          Middle
        </span>
        {/* Inner layer nested inside middle */}
        <InnerLayer log={log} />
      </div>
    </div>
  )
}

// ─── Outer (Parent) ──────────────────────────────────────────────────────────

function OuterLayer({
  log,
  showMiddle,
}: {
  log: (msg: string) => void
  showMiddle: boolean
}) {
  const [motion, api, style] = useAnimation({
    from: {
      transform: { translate: { y: 0 } },
      opacity: 0.5,
    },
    to: {
      transform: { translate: { y: 50 } },
      opacity: 1,
    },
    duration: 2.0,
    timingFunction: 'easeInOut',
    loop: { reverse: true },
    onStart: () => log('[outer] onStart'),
    onReset: values => log(`[outer] onReset → ${fmtValues(values)}`),
    onError: err => log(`[outer] onError → ${err.reason}`),
  })

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold text-blue-300">Outer (Parent)</span>
        <button className={btnCls} onClick={() => api.pause()}>
          Pause
        </button>
        <button className={btnCls} onClick={() => api.play()}>
          Resume
        </button>
        <button className={btnCls} onClick={() => api.reset()}>
          Reset
        </button>
        <PlayStateBadge state={api.playState} />
      </div>
      <div
        enable-xr
        xr-animation={motion}
        style={{
          width: 400,
          minHeight: 300,
          padding: 16,
          background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          ...style,
        }}
      >
        <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
          Outer
        </span>
        {/* Middle layer nested inside outer */}
        {showMiddle && <MiddleLayer log={log} />}
        {!showMiddle && (
          <div className="mt-3 text-xs text-gray-400 italic">
            Middle layer unmounted
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NestedAnimationPage() {
  const { lines, log, clear } = useLog()
  const [showMiddle, setShowMiddle] = useState(true)

  return (
    <SpatialElementMotionPageShell
      title="Nested Animation"
      description={
        <>
          Independent animations on nested{' '}
          <code className="text-cyan-300">enable-xr</code> divs (parent → child
          → grandchild). Verifies session isolation, suppression isolation,
          lifecycle callback independence, and unmount behavior.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        {/* Global controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className={showMiddle ? btnCls : btnPrimary}
            onClick={() => setShowMiddle(prev => !prev)}
          >
            {showMiddle ? 'Unmount Middle + Inner' : 'Mount Middle + Inner'}
          </button>
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>

        {/* Nested structure */}
        <OuterLayer log={log} showMiddle={showMiddle} />

        {/* Verification checklist */}
        <div className="mt-6 rounded-xl border border-gray-700 bg-black/30 p-4 text-xs text-gray-400">
          <div className="mb-2 font-semibold text-gray-300">
            Verification Checklist
          </div>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Independence</strong>: Outer loops continuously; Middle
              and Inner start/stop without affecting Outer.
            </li>
            <li>
              <strong>Simultaneous playback</strong>: All three layers can be in
              "running" state at once — each with its own native session.
            </li>
            <li>
              <strong>Interleaved control</strong>: Pause Middle → Outer and
              Inner continue. Reset Inner → Middle and Outer continue.
            </li>
            <li>
              <strong>Suppression isolation</strong>: Outer's translate.y
              suppression doesn't block Middle's rotate.z or Inner's scale.
            </li>
            <li>
              <strong>Lifecycle isolation</strong>: Each layer's onStart /
              onComplete / onReset fires independently (check log below).
            </li>
            <li>
              <strong>Unmount</strong>: "Unmount Middle + Inner" → Middle's
              onReset fires, Inner unmounts, Outer continues unaffected.
            </li>
          </ul>
        </div>

        {/* Event log */}
        <Log lines={lines} />
      </section>
    </SpatialElementMotionPageShell>
  )
}
