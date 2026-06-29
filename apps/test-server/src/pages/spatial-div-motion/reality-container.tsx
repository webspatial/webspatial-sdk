import { supports } from '@webspatial/core-sdk'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  SphereEntity,
  UnlitMaterial,
  useAnimation,
} from '@webspatial/react-sdk'
import { useState } from 'react'
import { btnCls, btnPrimary, fmtValues, Log, PlayStateBadge } from './shared'

const DURATION = 4

/**
 * Native timeline on the Reality root (`SpatializedDynamic3DElement`):
 * container translate.y + rotate.y while child entities stay in local space.
 */
export function SpatializedMotionRealityContainerPage() {
  const [lines, setLines] = useState<string[]>([])
  const [hint, setHint] = useState('Press Play or wait for auto-start')

  const dynamic3dAnim = supports('useAnimation')

  const [motion, api] = useAnimation({
    duration: DURATION,
    autoStart: true,
    tracks: [
      {
        property: 'transform.translate.y',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 0.18 },
        ],
        timingFunction: 'easeInOut',
      },
      {
        property: 'transform.rotate.y',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 90 },
        ],
        timingFunction: 'linear',
      },
    ],
    onStart: () => {
      setLines(l => [...l, 'onStart'])
      setHint('Playing — whole Reality container lifts + yaws')
    },
    onComplete: values => {
      setLines(l => [...l, `onComplete ${fmtValues(values as any)}`])
      setHint('Done — container at y≈0.18m, rotate.y=180°')
    },
    onReset: values => {
      setLines(l => [...l, `onReset ${fmtValues(values as any)}`])
      setHint('Reset — snapped to start keyframes')
    },
    onError: error => {
      setLines(l => [...l, `onError ${error.reason}`])
      setHint(`Native error — ${error.reason}`)
    },
  })

  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-xl font-bold mb-2">
        Dynamic3D — Reality container motion
      </h1>
      <p className="text-sm text-gray-400 mb-2">
        <code>useAnimation(&#123; from/to or tracks &#125;)</code> +{' '}
        <code>&lt;Reality xr-animation&gt;</code>. Timeline drives the{' '}
        <strong>Reality root</strong> (not child <code>Entity</code> nodes).
        Values are <strong>meters / degrees</strong>.
      </p>
      <p className="text-xs text-amber-400/90 mb-2">
        {dynamic3dAnim
          ? 'Native backend available. Rebuild WebSpatial.app after SDK changes (packages/visionOS).'
          : 'supports(dynamic3d)=false — rebuild visionOS shell (≥1.8.0). Plain browser cannot play native-only motion.'}
      </p>
      <p className="text-xs text-emerald-400/90 mb-4 font-mono">{hint}</p>
      <div className="mb-3 flex items-center gap-3">
        <PlayStateBadge state={api.playState} />
      </div>
      <p className="text-xs text-gray-500 mb-4 font-mono">
        supports(useAnimation, dynamic3d)={String(dynamic3dAnim)} ·
        xr-animation=
        {motion ? 'yes' : 'no'} · playState={api.playState}
      </p>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] mb-4">
        <Reality
          xr-animation={motion as any}
          style={{
            width: '100%',
            height: 480,
            '--xr-depth': 150,
            '--xr-back': 100,
          }}
        >
          <UnlitMaterial id="motionDemoRed" color="#ef4444" />
          <UnlitMaterial id="motionDemoBlue" color="#3b82f6" />
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.07}
              materials={['motionDemoRed']}
              position={{ x: -0.12, y: 0, z: 0 }}
            />
            <SphereEntity
              radius={0.05}
              materials={['motionDemoBlue']}
              position={{ x: 0.12, y: 0, z: 0 }}
            />
          </SceneGraph>
        </Reality>
      </div>

      {/* Expose full playback controls for manual motion verification. */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className={btnPrimary} onClick={() => api.play()}>
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

      <Log lines={lines} />
    </div>
  )
}
