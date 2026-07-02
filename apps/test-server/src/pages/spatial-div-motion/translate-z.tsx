import { supports } from '@webspatial/core-sdk'
import { useAnimation } from '@webspatial/react-sdk'
import { useEffect, useState } from 'react'
import { btnCls, btnPrimary, fmtNum, fmtValues, Log } from './shared'

const DURATION = 4

/** Depth-axis motion: panel moves along translate.z (spatial back/forward). */
export function SpatialDivMotionTranslateZPage() {
  const [lines, setLines] = useState<string[]>([])
  const [hint, setHint] = useState('Auto-start: translate.z 0 → -120px over 4s')

  const elementAnim = supports('useAnimation')

  const [motion, api, style] = useAnimation({
    duration: DURATION,
    autoStart: true,
    tracks: [
      {
        property: 'transform.translate.z',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: -120 },
        ],
        timingFunction: 'easeInOut',
      },
    ],
    onStart: () => {
      setLines(l => [...l, 'onStart'])
      setHint('Playing — depth (translate.z toward viewer)')
    },
    onComplete: values => {
      setLines(l => [...l, `onComplete ${fmtValues(values as any)}`])
      setHint('Done — translate.z at end keyframe')
    },
    onReset: values => {
      setLines(l => [...l, `onReset ${fmtValues(values as any)}`])
      setHint('Reset — back to z=0')
    },
    onError: error => {
      setLines(l => [...l, `onError ${error.reason}`])
      setHint(`Error — ${error.reason}`)
    },
  })

  useEffect(() => {
    if (api.playState !== 'paused') return
    const tx = (style.transform as string | undefined) ?? ''
    const match = /translate3d\([^,]+,[^,]+,\s*([-\d.]+)px/.exec(tx)
    const z = match ? Number(match[1]) : NaN
    setHint(`Paused — translate.z≈${fmtNum(z, 0)}px`)
  }, [api.playState, style.transform])

  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-xl font-bold mb-2">Plan B — translate.z (depth)</h1>
      <p className="text-sm text-gray-400 mb-2">
        Single-track depth motion. Use <code>--xr-back</code> so the panel has
        room in space. Negative z moves toward the viewer on AVP.
      </p>
      <p className="text-xs text-emerald-400/90 mb-4 font-mono">{hint}</p>
      <p className="text-xs text-gray-500 mb-4 font-mono">
        backend={elementAnim && motion ? 'native' : 'Web RAF'}
      </p>

      <div
        enable-xr
        {...{ 'xr-animation': motion as any }}
        className="box mb-4 rounded-xl border-2 border-sky-500/50"
        style={{
          width: 280,
          height: 160,
          '--xr-back': 80,
          background: 'linear-gradient(160deg, #0c4a6e 0%, #082f49 100%)',
          ...style,
        }}
      >
        <p className="text-white p-4 font-medium">Depth (translate.z)</p>
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
