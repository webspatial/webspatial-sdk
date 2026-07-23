import { useRef } from 'react'
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

export default function OpacityFadePage() {
  const { lines, log, clear } = useLog()
  const divRef = useRef<HTMLDivElement>(null)
  const suppressionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )

  const [motion, api, style] = useAnimation({
    from: { opacity: 1.0 },
    to: { opacity: 0.2 },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('opacity: onStart'),
    onComplete: values => log(`opacity: onComplete → ${fmtValues(values)}`),
    onReset: values => log(`opacity: onReset → ${fmtValues(values)}`),
    onError: err => log(`opacity: onError → ${err.reason}`),
  })

  const startSuppressionTest = () => {
    api.play()
    log('suppression: started animation + CSS interference')

    let tick = 0
    suppressionTimerRef.current = setInterval(() => {
      tick++
      if (divRef.current) {
        const interferenceValue = tick % 2 === 0 ? '0.9' : '0.5'
        divRef.current.style.opacity = interferenceValue
        log(`suppression: set CSS opacity=${interferenceValue} (tick ${tick})`)
      }
      if (tick >= 8) {
        if (suppressionTimerRef.current) {
          clearInterval(suppressionTimerRef.current)
          suppressionTimerRef.current = null
        }
        log('suppression: stopped CSS interference')
      }
    }, 200)
  }

  return (
    <SpatialElementMotionPageShell
      title="Opacity Fade + Suppression"
      description={
        <>
          Opacity 1.0→0.2 over 2s with easeInOut. The Suppression Test plays the
          animation while rapidly mutating CSS opacity — native should ignore
          CSS writes for animated fields and finish smoothly.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          ref={divRef}
          enable-xr
          xr-animation={motion}
          style={{
            width: 250,
            height: 150,
            background: 'linear-gradient(135deg, #1e5f3a, #2d8754)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Fade Me</span>
        </div>

        {/* Full playback controls for manual motion verification. */}
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
          <button className={btnCls} onClick={() => api.finish()}>
            Finish
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
        <Log lines={lines} />
      </section>
    </SpatialElementMotionPageShell>
  )
}
