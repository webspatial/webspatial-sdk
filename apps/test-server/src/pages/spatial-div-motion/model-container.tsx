import { supports } from '@webspatial/core-sdk'
import { Model, useAnimation } from '@webspatial/react-sdk'
import { useState } from 'react'
import { btnCls, btnPrimary, fmtValues, Log, PlayStateBadge } from './shared'

const DURATION = 4

/**
 * Native timeline on Static3D root (`modelTransform` on SpatializedStatic3DElement).
 */
export function SpatializedMotionModelContainerPage() {
  const [lines, setLines] = useState<string[]>([])
  const [hint, setHint] = useState('Press Play or wait for auto-start')

  const static3dAnim = supports('useAnimation')

  const [motion, api] = useAnimation({
    duration: DURATION,
    autoStart: true,
    tracks: [
      {
        property: 'transform.translate.y',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 0.12 },
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
      setHint('Playing — model root lifts + yaws (modelTransform)')
    },
    onComplete: values => {
      setLines(l => [...l, `onComplete ${fmtValues(values as any)}`])
      setHint('Done — translate.y≈0.12m, rotate.y=90°')
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
        Static3D — Model container motion
      </h1>
      <p className="text-sm text-gray-400 mb-2">
        <code>useAnimation(&#123; from/to or tracks &#125;)</code> +{' '}
        <code>&lt;Model xr-animation&gt;</code>. Timeline drives{' '}
        <strong>modelTransform</strong> (not USD embedded clip playback).
        Separate from <code>ref.play()</code> on the model asset.
      </p>
      <p className="text-xs text-amber-400/90 mb-2">
        {static3dAnim
          ? 'Native backend available. Rebuild WebSpatial.app after SDK changes (packages/visionOS).'
          : 'supports(static3d)=false — rebuild visionOS shell (≥1.8.0). Plain browser cannot play native-only motion.'}
      </p>
      <p className="text-xs text-emerald-400/90 mb-4 font-mono">{hint}</p>
      <div className="mb-3 flex items-center gap-3">
        <PlayStateBadge state={api.playState} />
      </div>
      <p className="text-xs text-gray-500 mb-4 font-mono">
        supports(useAnimation, static3d)={String(static3dAnim)} · xr-animation=
        {motion ? 'yes' : 'no'} · playState={api.playState}
      </p>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] mb-4 p-6 flex justify-center">
        <Model
          enable-xr
          xr-animation={motion as any}
          poster="/img/toy_drummer.png"
          style={{
            width: 320,
            height: 320,
            '--xr-depth': 120,
            '--xr-back': 80,
          }}
          onLoad={() => setLines(l => [...l, 'model onLoad'])}
          onError={() => setLines(l => [...l, 'model onError'])}
        >
          <source
            src="https://webkit.org/demos/model-demos/models/stopwatch.usdz"
            type="model/vnd.usdz+zip"
          />
        </Model>
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
