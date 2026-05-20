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

export default function PlaybackRatePage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: {
      transform: { rotate: { z: 0 } },
      opacity: 1.0,
    },
    to: {
      transform: { rotate: { z: 360 } },
      opacity: 0.4,
    },
    duration: 2.0,
    timingFunction: 'linear',
    playbackRate: 2.0,
    autoStart: false,
    onStart: () => log('rate: onStart (2× speed, effective ~1s)'),
    onComplete: (values: any) => log(`rate: onComplete → ${fmtValues(values)}`),
    onCancel: (values: any) => log(`rate: onCancel → ${fmtValues(values)}`),
    onError: (err: any) => log(`rate: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Playback Rate (2× speed)"
      description="rotate.z 0→360 + opacity 1→0.4 over 2s at 2× speed (effective ~1s). Linear easing."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation as any}
          style={{
            width: 160,
            height: 160,
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
        <div className="mt-3 flex items-center gap-3">
          <PlayStateBadge state={(api as any).playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String((api as any).isAnimating)}
          </span>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
