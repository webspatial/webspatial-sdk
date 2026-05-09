import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function DepthPage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { depth: 0 },
    to: { depth: 100 },
    duration: 1.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('depth: onStart'),
    onComplete: (values: any) =>
      log(`depth: onComplete → depth=${values.depth?.toFixed(1)}`),
    onCancel: (values: any) =>
      log(`depth: onCancel → depth=${values.depth?.toFixed(1)}`),
    onError: (err: any) => log(`depth: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Depth"
      description={
        <>
          Depth 0→100 over 1.5s. The SpatialDiv gains volumetric depth, becoming
          a 3D slab.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation}
          style={{
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, #4a1a8a, #7c3aed)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Depth Me</span>
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
