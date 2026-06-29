import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { supports } from '@webspatial/core-sdk'
import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  fmtValues,
  useLog,
} from './shared'

export default function TransformTranslatePage() {
  const { lines, log, clear } = useLog()
  // State that triggers re-renders (used by suppression test)
  const [borderHue, setBorderHue] = useState(0)
  // Capability probe helps verify whether this runtime can use native
  // element playback or is falling back to the web timeline path.
  const supportsElementPlayback = supports('useAnimation')
  const suppressionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const latestStyleRef = useRef<CSSProperties>({})

  const [motion, api, style] = useAnimation({
    from: {
      transform: { translate: { x: 0, y: 0, z: 0 } },
    },
    to: {
      transform: { translate: { x: 100, y: 10, z: 100 } },
    },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('translate: onStart'),
    onComplete: values => log(`translate: onComplete → ${fmtValues(values)}`),
    onStop: values => log(`translate: onStop → ${fmtValues(values)}`),
    onReset: values => log(`translate: onReset → ${fmtValues(values)}`),
    onError: err => log(`translate: onError → ${err.reason}`),
  })

  // Demonstrates play re-entry: reset + play in one click ensures a fresh
  // session even if a previous one is still alive (covers spec 3.5).
  const restart = () => {
    api.reset()
    api.play()
    log('restart: reset() + play()')
  }

  useEffect(() => {
    latestStyleRef.current = style
  }, [style])

  const previousPlayStateRef = useRef(api.playState)

  useEffect(() => {
    const prev = previousPlayStateRef.current
    previousPlayStateRef.current = api.playState

    if (prev === 'finished' || api.playState !== 'finished') return

    const snapshot = latestStyleRef.current
    log(`translate: finish style snapshot → ${JSON.stringify(snapshot)}`)
    console.log('[transform-translate] finish style snapshot', snapshot)
  }, [api.playState, log])

  // Suppression test: plays animation + rapidly triggers re-renders via state
  // changes. If transform suppression works, the animation should be smooth.
  // If not, the element will jitter as updateTransform overwrites mid-frames.
  const startSuppressionTest = () => {
    api.play()
    log('suppression: started animation + re-render interference')

    let tick = 0
    suppressionTimerRef.current = setInterval(() => {
      tick++
      // Cycle border color to trigger React re-render → PortalInstanceContext sync
      setBorderHue((tick * 37) % 360)
      if (tick <= 5) {
        log(
          `suppression: re-render tick ${tick} (borderHue=${(tick * 37) % 360})`,
        )
      }
      if (tick >= 20) {
        if (suppressionTimerRef.current) {
          clearInterval(suppressionTimerRef.current)
          suppressionTimerRef.current = null
        }
        log('suppression: stopped interference (20 ticks)')
      }
    }, 100)
  }

  return (
    <SpatialDivAnimationPageShell
      title="Transform Translate"
      description={
        <>
          Translate (0,0,0)→(100, 10, 100)px over 2s. The SpatialDiv moves in 3D
          space using pixel-based translate values. Restart proves play re-entry
          semantics. The Suppression Test rapidly re-renders the component
          during animation — if transform suppression works, motion stays
          smooth.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          xr-animation={motion}
          style={{
            ...style,
            width: 200,
            height: 150,
            background: 'linear-gradient(135deg, #8a4a1a, #ed7a3a)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Border color driven by state — triggers re-render + native sync
            border: `2px solid hsl(${borderHue}, 70%, 50%)`,
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Move Me</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
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
          <button className={btnCls} onClick={() => api.stop()}>
            Stop
          </button>
          <button
            className={btnCls}
            onClick={() => {
              api.finish()
            }}
          >
            Finish
          </button>
          <button className={btnCls} onClick={restart}>
            Restart (reset + play)
          </button>
          <button
            className={btnCls + ' !bg-yellow-700 !text-white'}
            onClick={startSuppressionTest}
          >
            Suppression Test
          </button>
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String(api.isAnimating)} &nbsp; isPaused=
            {String(api.isPaused)} &nbsp; finished={String(api.finished)}
          </span>
        </div>
        <div className="mt-3 rounded-lg border border-sky-900/70 bg-sky-950/30 p-4 text-xs text-sky-100">
          <h4 className="mb-2 font-medium text-sky-200">
            Runtime Capability Probe
          </h4>
          <div className="font-mono">
            supports(useAnimation)={String(supportsElementPlayback)}
          </div>
          <div className="mt-2 text-sky-50/90">
            {supportsElementPlayback
              ? 'Native element motion is available in this runtime.'
              : 'Native element motion is unavailable in this runtime. If playState changes but the panel does not move, the page may be using the web fallback path.'}
          </div>
        </div>
        <Log lines={lines} />

        <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-4 text-xs text-gray-500">
          <h4 className="mb-2 font-medium text-gray-400">
            How to verify transform suppression
          </h4>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Click "Suppression Test"</strong> — this plays the
              translate animation while rapidly changing border color (triggers
              React re-render every 100ms).
            </li>
            <li>
              <strong>Reset / Stop / Finish</strong> show the three playback
              terminations: restore the start values, freeze the current frame,
              or jump to the final values.
            </li>
            <li>
              <strong>Expected (suppression works):</strong> element moves
              smoothly from origin to (100, 10, 100)px despite re-renders.
            </li>
            <li>
              <strong>Broken (no suppression):</strong> element jitters or snaps
              back to origin each re-render because{' '}
              <code>updateTransform(identityMatrix)</code> overwrites the
              animation mid-state.
            </li>
          </ul>
        </div>
      </section>
    </SpatialDivAnimationPageShell>
  )
}
