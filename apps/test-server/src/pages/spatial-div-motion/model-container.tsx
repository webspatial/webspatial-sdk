import { supports } from '@webspatial/core-sdk'
import { Model, useSpatializedMotion } from '@webspatial/react-sdk'
import { useState } from 'react'
import {
  btnCls,
  btnPrimary,
  fmtValues,
  Log,
} from '../spatial-div-animation/shared'

const DURATION = 4

/**
 * Native timeline on Static3D root (`modelTransform` on SpatializedStatic3DElement).
 */
export function SpatializedMotionModelContainerPage() {
  const [lines, setLines] = useState<string[]>([])
  const [hint, setHint] = useState('Press Play or wait for auto-start')

  const static3dAnim = supports('useAnimation', ['static3d'])

  const { api, motion } = useSpatializedMotion({
    kind: 'static3d',
    duration: DURATION,
    autoStart: true,
    tracks: [
      {
        property: 'transform.translate.y',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 0.12 },
        ],
        easing: 'easeInOut',
      },
      {
        property: 'transform.rotate.y',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 90 },
        ],
        easing: 'linear',
      },
    ],
    onStart: () => {
      setLines(l => [...l, 'onStart'])
      setHint('Playing — model root lifts + yaws (modelTransform)')
    },
    onComplete: values => {
      setLines(l => [...l, `onComplete ${fmtValues(values)}`])
      setHint('Done — translate.y≈0.12m, rotate.y=90°')
    },
    onCancel: values => {
      setLines(l => [...l, `onCancel ${fmtValues(values)}`])
      setHint('Canceled — snapped to start keyframes')
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
        <code>
          useSpatializedMotion(&#123; kind: &apos;static3d&apos; &#125;)
        </code>{' '}
        + <code>&lt;Model motion&gt;</code>. Timeline drives{' '}
        <strong>modelTransform</strong> (not USD embedded clip playback).
        Separate from <code>ref.play()</code> on the model asset.
      </p>
      <p className="text-xs text-amber-400/90 mb-2">
        {static3dAnim
          ? 'Native backend available. Rebuild WebSpatial.app after SDK changes (packages/visionOS).'
          : 'supports(static3d)=false — rebuild visionOS shell (≥1.8.0). Plain browser cannot play native-only motion.'}
      </p>
      <p className="text-xs text-emerald-400/90 mb-4 font-mono">{hint}</p>
      <p className="text-xs text-gray-500 mb-4 font-mono">
        supports(useAnimation, static3d)={String(static3dAnim)} · motion=
        {motion ? 'yes' : 'no'} · playState={api.playState}
      </p>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] mb-4 p-6 flex justify-center">
        <Model
          enable-xr
          motion={motion}
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
        <button type="button" className={btnCls} onClick={() => api.cancel()}>
          Cancel
        </button>
      </div>

      <Log lines={lines} />
    </div>
  )
}
