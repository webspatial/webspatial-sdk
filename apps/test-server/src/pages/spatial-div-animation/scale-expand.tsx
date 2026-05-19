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

export default function ScaleExpandPage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
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
    onComplete: (values: any) =>
      log(`scale: onComplete → ${fmtValues(values)}`),
    onCancel: (values: any) =>
      log(`scale: onCancel (restored) → ${fmtValues(values)}`),
    onError: (err: any) => log(`scale: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Scale Expand + Cancel"
      description="transform.scale 0.6→1.0 over 1s. Cancel restores the from snapshot — no manual React state sync required."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation as any}
          style={{
            width: 240,
            height: 160,
            background: 'linear-gradient(135deg, #3a1e5f, #5a2d87)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: 14 }}>Scale Me</span>
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
        <div className="mt-3 flex items-center gap-3">
          <PlayStateBadge state={(api as any).playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String((api as any).isAnimating)} &nbsp; isPaused=
            {String((api as any).isPaused)} &nbsp; finished=
            {String((api as any).finished)}
          </span>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
