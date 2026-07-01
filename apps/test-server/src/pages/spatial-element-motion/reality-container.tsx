import { supports } from '@webspatial/core-sdk'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  SphereEntity,
  UnlitMaterial,
  useAnimation,
} from '@webspatial/react-sdk'
import {
  Log,
  PlayStateBadge,
  SpatialDivAnimationPageShell,
  btnCls,
  btnPrimary,
  fmtValues,
  useLog,
} from './shared'

const DURATION = 4

const TIMELINE_CONFIG = {
  '0%': {
    opacity: 0.35,
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
    opacity: 0.9,
    transform: {
      translate: { y: 0, z: 20 },
      rotate: { x: 20 },
      scale: { x: 2, y: 1, z: 1 },
    },
  },
} as const

export default function SpatialElementMotionRealityContainerPage() {
  const { lines, log } = useLog()
  const dynamic3dAnim = supports('useAnimation')

  const [motion, api, style] = useAnimation({
    duration: DURATION,
    autoStart: true,
    timeline: TIMELINE_CONFIG,
    onStart: () => {
      log('realityContainer: onStart')
    },
    onComplete: values => {
      log(`realityContainer: onComplete -> ${fmtValues(values as any)}`)
    },
    onReset: values => {
      log(`realityContainer: onReset -> ${fmtValues(values as any)}`)
    },
    onError: error => {
      log(`realityContainer: onError -> ${error.reason}`)
    },
  })

  return (
    <SpatialDivAnimationPageShell
      title="Reality Container Timeline"
      description={
        <>
          Tests <code>useAnimation</code> timeline percentage keyframes on the{' '}
          <code>Reality</code> container root. The animation drives opacity,
          translate, rotate, and scale on the native dynamic3d path.
        </>
      }
    >
      <section
        enable-xr-monitor
        className="rounded-2xl border border-gray-800 bg-[#111] p-6 text-gray-200"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            supports(dynamic3d)={String(dynamic3dAnim)} · xr-animation=
            {motion ? 'yes' : 'no'} · duration={DURATION}s
          </span>
        </div>

        <p className="mb-4 text-xs text-gray-400">
          Timeline checkpoints: <code>0%</code>, <code>50%</code>,{' '}
          <code>100%</code>.
        </p>

        <p className="mb-4 text-xs text-amber-400/90">
          {dynamic3dAnim
            ? 'Native backend available. Verify the whole Reality container changes pose and opacity over time.'
            : 'supports(dynamic3d)=false. In a plain browser this page can still expose hook state, but native Reality motion will not play.'}
        </p>

        <div className="relative mb-4 overflow-hidden rounded-xl border border-gray-800 bg-[#050505]">
          <Reality
            xr-animation={motion as any}
            style={{
              ...style,
              width: '100%',
              height: 480,
              '--xr-depth': 150,
              '--xr-back': 100,
            }}
          >
            <UnlitMaterial id="green" color="#f8f53aff" opacity={0.85} />
            <UnlitMaterial id="blue" color="#3858f8ff" opacity={0.5} />
            <UnlitMaterial id="yellow" color="#cff838ff" opacity={0.5} />
            <UnlitMaterial id="red" color="#b41111ff" opacity={0.5} />
            <SceneGraph>
              <BoxEntity
                id="motionBox"
                width={0.18}
                height={0.18}
                depth={0.18}
                cornerRadius={0.03}
                materials={['green', 'blue', 'yellow', 'red', 'green', 'blue']}
                position={{ x: 0, y: 0, z: 0 }}
                splitFaces={true}
              />
            </SceneGraph>
          </Reality>
        </div>

        <div className="mb-4 rounded-xl border border-gray-800 bg-black/30 p-3 font-mono text-xs text-gray-300">
          style: opacity={String(style.opacity ?? '-')} transform=
          {String(style.transform ?? '-')}
        </div>

        {/* Keep full playback controls for manual verification. */}
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
          <button type="button" className={btnCls} onClick={() => api.resume()}>
            Resume
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
            'timeline: 0% opacity 0.35 y 12 z 0 scale 0.75',
            'timeline: 50% opacity 1 y -8 z 55 scale 1.12',
            'timeline: 100% opacity 0.9 y 0 z 20 scale x 2 y 1 z 1',
            ...lines,
          ]}
        />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
