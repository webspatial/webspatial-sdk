import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function PlaybackRatePage() {
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
    <SpatialDivAnimationPageShell
      title="Playback Rate (2× speed)"
      description="Width 150→450 + opacity 1→0.4 over 2s at 2× speed (effective 1s). Linear easing."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
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
    </SpatialDivAnimationPageShell>
  )
}
