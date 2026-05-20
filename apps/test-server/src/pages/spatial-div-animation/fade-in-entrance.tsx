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
      description="translate.z -50→0 and opacity 0→1 with easeOut over 0.6s. Auto-starts on element bind. Remount to replay."
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
        </div>
        <FadeInScene key={key} log={log} />
        <Log lines={lines} />
      </section>
    </SpatialDivAnimationPageShell>
  )
}

function FadeInScene({ log }: { log: (msg: string) => void }) {
  const [animation] = useAnimation({
    from: {
      transform: { translate: { z: -50 } },
      opacity: 0,
    },
    to: {
      transform: { translate: { z: 0 } },
      opacity: 1,
    },
    duration: 0.6,
    timingFunction: 'easeOut',
    onStart: () => log('fadeIn: onStart'),
    onComplete: (values: any) =>
      log(`fadeIn: onComplete → ${fmtValues(values)}`),
    onError: (err: any) => log(`fadeIn: onError → ${err.reason}`),
  } as any)

  return (
    <div
      enable-xr
      animation={animation as any}
      style={{
        width: 300,
        height: 150,
        background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
        Hello Spatial
      </span>
    </div>
  )
}
