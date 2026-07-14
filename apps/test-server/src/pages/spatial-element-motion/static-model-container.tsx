import { supports } from '@webspatial/core-sdk'
import { Model, useAnimation } from '@webspatial/react-sdk'
import {
  Log,
  PlayStateBadge,
  SpatialElementMotionPageShell,
  btnCls,
  btnPrimary,
  fmtValues,
  useLog,
} from './shared'

const DURATION = 4

const TIMELINE_CONFIG = {
  '0%': {
    opacity: 0.1,
    transform: {
      translate: { y: 12, z: 0 },
      rotate: { x: 30, z: -20 },
      scale: { x: 0.75, y: 0.75, z: 0.75 },
    },
  },
  '50%': {
    opacity: 1,
    transform: {
      translate: { y: -8, z: 55 },
      rotate: { x: 10, z: 80 },
      scale: { x: 1.12, y: 1.12, z: 1.12 },
    },
  },
  '100%': {
    opacity: 0.1,
    transform: {
      translate: { y: 0, z: 20 },
      rotate: { x: 20 },
      scale: { x: 2, y: 1, z: 1 },
    },
  },
} as const

export default function SpatialElementMotionStaticModelContainerPage() {
  const { lines, log } = useLog()
  const static3dAnim = supports('useAnimation')

  const [motion, api, style] = useAnimation({
    duration: DURATION,
    autoStart: true,
    timeline: TIMELINE_CONFIG,
    onStart: () => {
      log('staticModelContainer: onStart')
    },
    onComplete: values => {
      log(`staticModelContainer: onComplete -> ${fmtValues(values as any)}`)
    },
    onReset: values => {
      log(`staticModelContainer: onReset -> ${fmtValues(values as any)}`)
    },
    onError: error => {
      log(`staticModelContainer: onError -> ${error.reason}`)
    },
  })

  return (
    <SpatialElementMotionPageShell
      title="Static Model Container Timeline"
      description={
        <>
          Tests <code>useAnimation</code> timeline percentage keyframes on the{' '}
          <code>Model</code> container root transform. Use this page to compare
          whether <code>enable-xr-monitor</code> causes the same play or pause
          snap-back issue previously seen on <code>Reality</code>.
        </>
      }
    >
      <section
        // enable-xr-monitor
        className="rounded-2xl border border-gray-800 bg-[#111] p-6 text-gray-200"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            supports(static3d)={String(static3dAnim)} · xr-animation=
            {motion ? 'yes' : 'no'} · duration={DURATION}s
          </span>
        </div>

        <p className="mb-4 text-xs text-gray-400">
          Manual check: press <code>Play</code> or <code>Pause</code> while the
          monitor is enabled and verify whether the model root pose snaps back
          to the start.
        </p>

        <p className="mb-4 text-xs text-amber-400/90">
          {static3dAnim
            ? 'Native backend available. Verify the Model root pose changes over time.'
            : 'supports(static3d)=false. In a plain browser this page can still expose hook state, but native Model motion will not play.'}
        </p>

        <div className="relative mb-4 overflow-hidden rounded-xl border border-gray-800 bg-[#050505] p-6">
          <div className="flex justify-center">
            <Model
              enable-xr
              xr-animation={motion as any}
              poster="/img/toy_drummer.png"
              style={{
                ...style,
                width: 320,
                height: 320,
                '--xr-depth': 120,
                '--xr-back': 80,
              }}
              onLoad={() => {
                log('staticModelContainer: model onLoad')
              }}
              onError={() => {
                log('staticModelContainer: model onError')
              }}
            >
              <source
                src="https://webkit.org/demos/model-demos/models/stopwatch.usdz"
                type="model/vnd.usdz+zip"
              />
            </Model>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-gray-800 bg-black/30 p-3 font-mono text-xs text-gray-300">
          style: opacity={String(style.opacity ?? '-')} transform=
          {String(style.transform ?? '-')}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
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
          <button type="button" className={btnCls} onClick={() => api.stop()}>
            Stop
          </button>
          <button type="button" className={btnCls} onClick={() => api.finish()}>
            Finish
          </button>
          <button type="button" className={btnCls} onClick={() => api.reset()}>
            Reset
          </button>
        </div>

        <Log
          lines={[
            'timeline: 0% y 12 z 0 scale 0.75',
            'timeline: 50% y -8 z 55 scale 1.12',
            'timeline: 100% y 0 z 20 scale x 2 y 1 z 1',
            ...lines,
          ]}
        />
      </section>
    </SpatialElementMotionPageShell>
  )
}
