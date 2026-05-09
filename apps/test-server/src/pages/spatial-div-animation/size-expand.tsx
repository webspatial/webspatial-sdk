import { useState } from 'react'
import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function SizeExpandPage() {
  const { lines, log, clear } = useLog()
  const [size, setSize] = useState({ width: 200, height: 120 })

  const [animation, api] = useAnimation({
    to: { width: 400, height: 240 },
    duration: 1.0,
    autoStart: false,
    timingFunction: 'easeInOut',
    onStart: () => log('size: onStart'),
    onComplete: (values: any) =>
      log(
        `size: onComplete → w=${values.width?.toFixed(0)} h=${values.height?.toFixed(0)}`,
      ),
    onCancel: (values: any) => {
      log(
        `size: onCancel → w=${values.width?.toFixed(0)} h=${values.height?.toFixed(0)}`,
      )
      if (values.width != null && values.height != null) {
        setSize({ width: values.width, height: values.height })
      }
    },
    onError: (err: any) => log(`size: onError → ${err.reason}`),
  } as any)

  return (
    <SpatialDivAnimationPageShell
      title="Size Expand + Cancel Sync"
      description="Width 200→400, height 120→240 over 1s. Manual trigger. Cancel restores and syncs React state."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          animation={animation}
          style={{
            width: size.width,
            height: size.height,
            background: 'linear-gradient(135deg, #3a1e5f, #5a2d87)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'none',
          }}
        >
          <span style={{ color: 'white', fontSize: 14 }}>
            {size.width}×{size.height}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button className={btnPrimary} onClick={() => (api as any).play()}>
            Play (Expand)
          </button>
          <button className={btnCls} onClick={() => (api as any).pause()}>
            Pause
          </button>
          <button className={btnCls} onClick={() => (api as any).play()}>
            Resume
          </button>
          <button className={btnCls} onClick={() => (api as any).cancel()}>
            Cancel
          </button>
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          playState:{' '}
          <code className="text-cyan-300">{(api as any).playState}</code>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}
