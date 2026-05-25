import { useSpatialDivMotion } from '@webspatial/react-sdk'
import { useEffect, useState } from 'react'
import {
  btnCls,
  btnPrimary,
  fmtNum,
  fmtValues,
  Log,
} from '../spatial-div-animation/shared'

const DURATION = 5

/**
 * Canonical Plan B acceptance demo:
 * - translate.x: 0 → 100 over 0–5s
 * - opacity: 0 → 1 over 3–5s
 */
export function SpatialDivMotionMultiTrackPage() {
  const [lines, setLines] = useState<string[]>([])
  const [hint, setHint] = useState('Press Play or wait for auto-start')

  const { style, api, motion } = useSpatialDivMotion({
    duration: DURATION,
    autoStart: true,
    tracks: [
      {
        property: 'transform.translate.x',
        keyframes: [
          { at: 0, value: 0 },
          { at: DURATION, value: 100 },
        ],
        easing: 'linear',
      },
      {
        property: 'opacity',
        keyframes: [
          { at: 3, value: 0.5 },
          { at: DURATION, value: 1 },
        ],
        easing: 'easeOut',
      },
    ],
    onStart: () => {
      setLines(l => [...l, 'onStart'])
      setHint('Playing… (0–3s: move only; 3–5s: move + fade)')
    },
    onComplete: values => {
      setLines(l => [...l, `onComplete ${fmtValues(values)}`])
      setHint('Done — card fully visible at translate.x=100')
    },
    onCancel: values => {
      setLines(l => [...l, `onCancel ${fmtValues(values)}`])
      setHint('Canceled — reset to start keyframes')
    },
  })

  useEffect(() => {
    if (api.playState !== 'running') return
    const id = window.setInterval(() => {
      const tx = (style.transform as string | undefined) ?? ''
      const match = /translate3d\(([-\d.]+)px/.exec(tx)
      const x = match ? Number(match[1]) : NaN
      const o = style.opacity as number | undefined
      setHint(
        `t≈running · translate.x≈${fmtNum(x, 0)}px · opacity=${fmtNum(o, 2)}`,
      )
    }, 100)
    return () => clearInterval(id)
  }, [api.playState, style.transform, style.opacity])

  return (
    <div className="p-6 text-gray-200 max-w-3xl">
      <h1 className="text-xl font-bold mb-2">Plan B — Multi-track motion</h1>
      <p className="text-sm text-gray-400 mb-2">
        Auto-starts on load. Works in <strong>plain Chrome</strong> (Web
        backend) and in spatial runtime.
      </p>
      <p className="text-xs text-emerald-400/90 mb-4 font-mono">{hint}</p>

      <div
        enable-xr
        motion={motion}
        className="box mb-4 rounded-xl border-2 border-emerald-500/50 shadow-lg shadow-emerald-900/30"
        style={{
          width: 280,
          height: 160,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
          ...style,
        }}
      >
        <p className="text-white p-4 font-medium">Motion timeline</p>
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
        <button type="button" className={btnCls} onClick={() => api.cancel()}>
          Cancel
        </button>
      </div>

      <Log lines={lines} />
    </div>
  )
}
