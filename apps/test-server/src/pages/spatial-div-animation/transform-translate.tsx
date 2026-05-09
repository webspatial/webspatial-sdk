import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
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
      log(
        `translate: onComplete → x=${values['transform.translate.x']?.toFixed(1)}, y=${values['transform.translate.y']?.toFixed(1)}, z=${values['transform.translate.z']?.toFixed(1)}`,
      ),
    onCancel: (values: any) =>
      log(
        `translate: onCancel → x=${values['transform.translate.x']?.toFixed(1)}, y=${values['transform.translate.y']?.toFixed(1)}, z=${values['transform.translate.z']?.toFixed(1)}`,
      ),
    onError: (err: any) => log(`translate: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Transform Translate"
      description={
        <>
          Translate (0,0,0)→(100,50,-80) over 2s. The SpatialDiv moves in 3D
          space: right (+X), up (+Y), and toward the user (-Z).
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
