import { useState } from 'react'
import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  btnCls,
  fmtValues,
  useLog,
} from './shared'

export default function FadeInEntrancePage() {
  const { lines, log, clear } = useLog()
  const [key, setKey] = useState(0)

  return (
    <SpatialDivAnimationPageShell
      title="Fade-In Entrance"
      description="translate.z 0→100 and opacity 0→1 with easeOut over 0.6s. Auto-starts on element bind, and the controls let you replay or force the timeline state."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className={btnCls}
            onClick={() => {
              setKey(prev => prev + 1)
              clear()
            }}
          >
            Remount (Replay)
          </button>
          <button className={btnCls} onClick={clear}>
            Clear log
          </button>
        </div>
        <FadeInScene key={key} log={log} />
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}

function FadeInScene({ log }: { log: (msg: string) => void }) {
  const [motion, api, style] = useAnimation({
    from: {
      transform: { translate: { z: 0 } },
      opacity: 0,
    },
    to: {
      transform: { translate: { z: 100 } },
      opacity: 1,
    },
    duration: 3,
    timingFunction: 'easeOut',
    onStart: () => log('fadeIn: onStart'),
    onComplete: values => log(`fadeIn: onComplete → ${fmtValues(values)}`),
    onReset: values => log(`fadeIn: onReset → ${fmtValues(values)}`),
    onError: err => log(`fadeIn: onError → ${err.reason}`),
  })

  return (
    <>
      {/* Manual controls keep this demo aligned with other motion pages. */}
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={btnCls} onClick={() => api.play()}>
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
      <div
        enable-xr
        xr-animation={motion}
        style={{
          width: 300,
          height: 150,
          background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
          Hello Spatial
        </span>
      </div>
    </>
  )
}
