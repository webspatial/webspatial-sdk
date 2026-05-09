import { useRef } from 'react'
import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function OpacityFadePage() {
  const { lines, log, clear } = useLog()
  const divRef = useRef<HTMLDivElement>(null)
  const suppressionTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )

  const [animation, api] = useAnimation({
    from: { opacity: 1.0 },
    to: { opacity: 0.2 },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('opacity: onStart'),
    onComplete: (values: any) =>
      log(`opacity: onComplete → opacity=${values.opacity?.toFixed(2)}`),
    onCancel: (values: any) =>
      log(`opacity: onCancel → opacity=${values.opacity?.toFixed(2)}`),
    onError: (err: any) => log(`opacity: onError → ${err.reason}`),
  } as any)

  const startSuppressionTest = () => {
    // Play animation first
    ;(api as any).play()
    log('suppression: started animation + CSS interference')

    // Every 200ms, forcibly set CSS opacity to 0.9
    // If suppression works, native should ignore these and continue smooth animation
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
    <SpatialDivAnimationPageShell
      title="Opacity Fade"
      description={
        <>
          Opacity 1.0→0.2 over 2s with easeInOut. Uses{' '}
          <code className="text-cyan-300">useAnimation</code> — auto-dispatches
          to SpatialDiv path since <code>opacity</code> is a SpatialDiv key.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          ref={divRef}
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
        <div className="text-xs text-gray-500 mt-2">
          playState:{' '}
          <code className="text-cyan-300">{(api as any).playState}</code>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Suppression Test: plays animation then rapidly changes CSS opacity.
          Native should ignore CSS changes and animate smoothly.
        </p>
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
