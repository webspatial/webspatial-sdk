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

  const [animation, api] = useAnimation({
    from: { opacity: 1.0 },
    to: { opacity: 0.2 },
    duration: 0.8,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('opacity: onStart'),
    onComplete: (values: any) =>
      log(`opacity: onComplete → opacity=${values.opacity?.toFixed(2)}`),
    onCancel: (values: any) =>
      log(`opacity: onCancel → opacity=${values.opacity?.toFixed(2)}`),
    onError: (err: any) => log(`opacity: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Opacity Fade"
      description={
        <>
          Opacity 1.0→0.2 over 0.8s with easeInOut. Uses{' '}
          <code className="text-cyan-300">useAnimation</code> — auto-dispatches
          to SpatialDiv path since <code>opacity</code> is a SpatialDiv key.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
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
