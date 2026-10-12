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

export default function CombinedDelayPage() {
  const { lines, log, clear } = useLog()

  const [motion, api, style] = useAnimation({
    from: {
      transform: {
        translate: { y: -30 },
        scale: { x: 0.8, y: 0.8, z: 1 },
      },
      opacity: 0.3,
    },
    to: {
      transform: {
        translate: { y: 0 },
        scale: { x: 1.0, y: 1.0, z: 1 },
      },
      opacity: 1.0,
    },
    duration: 1.2,
    delay: 0.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('combined: onStart (after 500ms delay)'),
    onComplete: values => log(`combined: onComplete → ${fmtValues(values)}`),
    onReset: values => log(`combined: onReset → ${fmtValues(values)}`),
    onError: err => log(`combined: onError → ${err.reason}`),
  })

  return (
    <SpatialElementMotionPageShell
      title="Combined Properties + 500ms Delay"
      description="Animates transform.translate.y, transform.scale, and opacity simultaneously after a 500ms delay. Duration 1.2s."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          xr-animation={motion}
          style={{
            width: 240,
            height: 140,
            background: 'linear-gradient(135deg, #5f3a1e, #874d2d)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span style={{ color: 'white', fontSize: 14 }}>Combined</span>
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
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String(api.isAnimating)} &nbsp; isPaused=
            {String(api.isPaused)}
          </span>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialElementMotionPageShell>
  )
}
