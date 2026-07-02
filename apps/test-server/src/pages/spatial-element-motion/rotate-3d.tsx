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

export default function Rotate3DPage() {
  const { lines, log, clear } = useLog()

  const [motion, api, style] = useAnimation({
    from: {
      transform: { rotate: { x: 0, y: 0, z: 0 } },
    },
    to: {
      transform: { rotate: { x: 180, y: 180, z: 180 } },
    },
    duration: 2.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('rotate3d: onStart'),
    onComplete: values => log(`rotate3d: onComplete → ${fmtValues(values)}`),
    onReset: values => log(`rotate3d: onReset → ${fmtValues(values)}`),
    onError: err => log(`rotate3d: onError → ${err.reason}`),
  })

  return (
    <SpatialDivAnimationPageShell
      title="3D Rotate (X/Y/Z)"
      description="transform.rotate.x/y/z 0→180 degrees over 2.5s. Pause / resume / reset exercise the full session lifecycle."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          xr-animation={motion}
          style={{
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, #4a1a8a, #7c3aed)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Rotate Me</span>
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
    </SpatialDivAnimationPageShell>
  )
}
