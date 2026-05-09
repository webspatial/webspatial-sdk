import { useAnimation } from '@webspatial/react-sdk'
import { SpatialDivAnimationPageShell, Log, btnCls, useLog } from './shared'

export default function FadeInEntrancePage() {
  const { lines, log, clear } = useLog()

  const [animation] = useAnimation({
    from: { back: -50, opacity: 0 },
    to: { back: 0, opacity: 1 },
    duration: 0.6,
    timingFunction: 'easeOut',
    onStart: () => log('fadeIn: onStart'),
    onComplete: (values: any) =>
      log(
        `fadeIn: onComplete → back=${values.back?.toFixed(1)} opacity=${values.opacity?.toFixed(2)}`,
      ),
    onError: (err: any) => log(`fadeIn: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Fade-In Entrance"
      description="Back offset -50→0 and opacity 0→1 with easeOut over 0.6s. Auto-starts on element bind."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation}
          style={{
            width: 300,
            height: 150,
            background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
            Hello Spatial
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
