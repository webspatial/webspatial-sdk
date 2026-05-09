import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function CombinedDelayPage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { width: 200, height: 120, opacity: 0.3, depth: 0 },
    to: { width: 350, height: 200, opacity: 1.0, depth: 60 },
    duration: 1.2,
    delay: 0.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('combined: onStart (after 500ms delay)'),
    onComplete: (values: any) =>
      log(
        `combined: onComplete → w=${values.width?.toFixed(0)} h=${values.height?.toFixed(0)} o=${values.opacity?.toFixed(2)} d=${values.depth?.toFixed(0)}`,
      ),
    onCancel: (values: any) =>
      log(
        `combined: onCancel → w=${values.width?.toFixed(0)} o=${values.opacity?.toFixed(2)}`,
      ),
    onError: (err: any) => log(`combined: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Combined Properties + 500ms Delay"
      description="Animates width, height, opacity, and depth simultaneously. Starts after 500ms delay. Duration 1.2s."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation}
          style={{
            width: 200,
            height: 120,
            background: 'linear-gradient(135deg, #5f3a1e, #874d2d)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: 14 }}>Combined</span>
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
