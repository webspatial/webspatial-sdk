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

export default function ScaleExpandPage() {
  const { lines, log, clear } = useLog()

  const [motion, api, style] = useAnimation({
    from: {
      transform: { scale: { x: 0.6, y: 0.6, z: 1 } },
    },
    to: {
      transform: { scale: { x: 1.0, y: 1.0, z: 1 } },
    },
    duration: 1.0,
    autoStart: false,
    timingFunction: 'easeInOut',
    onStart: () => log('scale: onStart'),
    onComplete: values => log(`scale: onComplete → ${fmtValues(values)}`),
    onReset: values => log(`scale: onReset (restored) → ${fmtValues(values)}`),
    onError: err => log(`scale: onError → ${err.reason}`),
  })

  return (
    <SpatialElementMotionPageShell
      title="Scale Expand + Cancel"
      description="transform.scale 0.6→1.0 over 1s. Cancel restores the from snapshot — no manual React state sync required."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          xr-animation={motion}
          style={{
            width: 240,
            height: 160,
            background: 'linear-gradient(135deg, #3a1e5f, #5a2d87)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span style={{ color: 'white', fontSize: 14 }}>Scale Me</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button className={btnPrimary} onClick={() => api.play()}>
            Play (Expand)
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
            {String(api.isPaused)} &nbsp; finished={String(api.finished)}
          </span>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialElementMotionPageShell>
  )
}
