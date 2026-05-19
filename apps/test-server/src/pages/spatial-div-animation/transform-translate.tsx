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

export default function TransformTranslatePage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: {
      'transform.translate.x': 0,
      'transform.translate.y': 0,
      'transform.translate.z': 0,
    },
    to: {
      'transform.translate.x': 100,
      'transform.translate.y': 50,
      'transform.translate.z': -80,
    },
    duration: 2.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log('translate: onStart'),
    onComplete: (values: any) =>
      log(`translate: onComplete → ${fmtValues(values)}`),
    onCancel: (values: any) =>
      log(`translate: onCancel → ${fmtValues(values)}`),
    onError: (err: any) => log(`translate: onError → ${err.reason}`),
  } as any)

  // Demonstrates play re-entry: cancel + play in one click ensures a fresh
  // session even if a previous one is still alive (covers spec 3.5).
  const restart = () => {
    ;(api as any).cancel()
    ;(api as any).play()
    log('restart: cancel() + play()')
  }

  return (
    <SpatialDivAnimationPageShell
      title="Transform Translate"
      description={
        <>
          Translate (0,0,0)→(100,50,-80) over 2s. The SpatialDiv moves in 3D
          space: right (+X), up (+Y), and toward the user (-Z). Restart proves
          play re-entry semantics.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation as any}
          style={{
            width: 200,
            height: 150,
            background: 'linear-gradient(135deg, #8a4a1a, #ed7a3a)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Move Me</span>
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
          <button className={btnCls} onClick={restart}>
            Restart (cancel + play)
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
