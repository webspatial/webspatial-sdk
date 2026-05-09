import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function BackOffsetPage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { back: 0 },
    to: { back: 150 },
    duration: 1.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('back: onStart'),
    onComplete: (values: any) =>
      log(`back: onComplete → back=${values.back?.toFixed(1)}`),
    onCancel: (values: any) =>
      log(`back: onCancel → back=${values.back?.toFixed(1)}`),
    onError: (err: any) => log(`back: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Back Offset"
      description={
        <>
          Back offset 0→150 over 1.5s. The SpatialDiv moves backward in Z space
          (away from the user).
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation}
          style={{
            width: 200,
            height: 150,
            background: 'linear-gradient(135deg, #1a4a8a, #3a7aed)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Push Back</span>
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
