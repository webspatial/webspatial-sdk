import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  btnCls,
  btnPrimary,
  Log,
  fmtValues,
} from '../spatial-element-motion/shared'

export function SpatialDivMotionTimelinePercentPage() {
  const [motion, api, style] = useAnimation({
    duration: 4,
    autoStart: true,
    timingFunction: 'linear',
    timeline: {
      '0%': {
        opacity: 0,
        transform: { translate: { y: 24 } },
        // timingFunction: 'easeOut' as const,
      },
      '12.5%': {
        opacity: 1,
      },
      '60%': {
        opacity: 0,
        transform: { translate: { y: -6 } },
        // timingFunction: 'linear' as const,
      },
      '100%': {
        opacity: 1,
        transform: { translate: { y: 0 } },
      },
    },
  })

  return (
    <SpatialDivAnimationPageShell
      title="Timeline percentage keyframes"
      description={
        <>
          Demonstrates `timeline` parsing, decimal percentage keys, missing
          properties, and per-keyframe `timingFunction` cascade.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 text-gray-200">
        <div
          enable-xr
          {...{ 'xr-animation': motion as any }}
          className="box mb-4 rounded-xl border-2 border-sky-500/50 shadow-lg shadow-sky-900/30"
          style={{
            width: 280,
            height: 160,
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
            ...style,
          }}
        >
          <p className="text-white p-4 font-medium">0% → 12.5% → 60% → 100%</p>
        </div>

        <p className="text-xs font-mono text-gray-500 mb-3">
          playState={api.playState} · values={fmtValues(style as any)}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => api.play()}
          >
            Play
          </button>
          <button type="button" className={btnCls} onClick={() => api.pause()}>
            Pause
          </button>
          <button type="button" className={btnCls} onClick={() => api.reset()}>
            Reset
          </button>
        </div>

        <Log lines={['timeline: 0%, 12.5%, 60%, 100%']} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
