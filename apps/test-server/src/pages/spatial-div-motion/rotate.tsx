import { supports } from '@webspatial/core-sdk'
import { useAnimation } from '@webspatial/react-sdk'
import { useEffect, useState } from 'react'
import { btnCls, btnPrimary, fmtNum, fmtValues, Log } from './shared'

const DURATION = 4

/**
 * Rotate tracks: yaw (rotate.y) + spin (rotate.z) on overlapping timelines.
 */
export function SpatialDivMotionRotatePage() {
  const [lines, setLines] = useState<string[]>([])
  const [hint, setHint] = useState(
    'Auto-start: rotate.y 0→90° (0–4s), rotate.z 0→180° (1–4s)',
  )

  const elementAnim = supports('useAnimation')

  const [motion, api, style] = useAnimation({
    duration: DURATION,
    autoStart: true,
    tracks: [
      {
        property: 'transform.rotate.y',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 90 },
        ],
        timingFunction: 'easeInOut',
      },
      {
        property: 'transform.rotate.z',
        keyframes: [
          { at: 1, value: 0 },
          { at: DURATION, value: 180 },
        ],
        timingFunction: 'linear',
      },
    ],
    onStart: () => {
      setLines(l => [...l, 'onStart'])
      setHint('Playing — yaw + spin')
    },
    onComplete: values => {
      setLines(l => [...l, `onComplete ${fmtValues(values as any)}`])
      setHint('Done — rotate.y=90°, rotate.z=180°')
    },
    onReset: values => {
      setLines(l => [...l, `onReset ${fmtValues(values as any)}`])
      setHint('Reset — rotations reset')
    },
    onError: error => {
      setLines(l => [...l, `onError ${error.reason}`])
      setHint(`Error — ${error.reason}`)
    },
  })

  useEffect(() => {
    if (api.playState !== 'paused') return
    const tx = (style.transform as string | undefined) ?? ''
    const ry = /rotateY\(([-\d.]+)deg\)/.exec(tx)
    const rz = /rotateZ\(([-\d.]+)deg\)/.exec(tx)
    setHint(
      `Paused — rotate.y≈${fmtNum(ry ? Number(ry[1]) : NaN, 0)}° · rotate.z≈${fmtNum(rz ? Number(rz[1]) : NaN, 0)}°`,
    )
  }, [api.playState, style.transform])

  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-xl font-bold mb-2">Plan B — rotate (y + z)</h1>
      <p className="text-sm text-gray-400 mb-2">
        Multi-track rotation: card yaws on Y while spinning on Z after t=1s.
        Validates rotate keyframes on Web and native timeline.
      </p>
      <p className="text-xs text-emerald-400/90 mb-4 font-mono">{hint}</p>
      <p className="text-xs text-gray-500 mb-4 font-mono">
        backend={elementAnim && motion ? 'native' : 'Web RAF'}
      </p>

      <div
        enable-xr
        {...{ 'xr-animation': motion as any }}
        className="box mb-4 rounded-xl border-2 border-violet-500/50"
        style={{
          width: 280,
          height: 160,
          '--xr-back': 60,
          background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
          ...style,
        }}
      >
        <p className="text-white p-4 font-medium">Rotate Y + Z</p>
      </div>

      <p className="text-xs font-mono text-gray-500 mb-3">
        playState={api.playState} · transform={String(style.transform ?? '-')}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className={btnPrimary} onClick={() => api.play()}>
          Play
        </button>
        <button type="button" className={btnCls} onClick={() => api.pause()}>
          Pause
        </button>
        <button type="button" className={btnCls} onClick={() => api.reset()}>
          Reset
        </button>
      </div>

      <Log lines={lines} />
    </div>
  )
}
