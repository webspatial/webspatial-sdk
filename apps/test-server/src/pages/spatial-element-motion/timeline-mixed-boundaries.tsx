import { useState } from 'react'
import { useAnimation } from '@webspatial/react-sdk/experimental'
import {
  SpatialElementMotionPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  fmtValues,
  useLog,
} from './shared'

const DURATION = 3

// Mixed timeline: `from` (== 0%), an intermediate percentage keyframe, and
// `to` (== 100%). Exercises the "timeline may combine from/to with percentage
// keyframes" authoring path from the Motion Timeline config design.
const MIXED_TIMELINE = {
  from: {
    transform: { translate: { y: 24 }, scale: { x: 0.8, y: 0.8, z: 0.8 } },
    opacity: 0,
  },
  '50%': {
    transform: { translate: { y: 12 }, scale: { x: 1.1, y: 1.1, z: 1.1 } },
    opacity: 0.5,
  },
  to: {
    transform: { translate: { y: 0 }, scale: { x: 1, y: 1, z: 1 } },
    opacity: 1,
  },
} as const

export default function TimelineMixedBoundariesPage() {
  const { lines, log, clear } = useLog()
  const [key, setKey] = useState(0)

  return (
    <SpatialElementMotionPageShell
      title="Timeline Mixed Boundaries"
      description={
        <>
          Tests <code>useAnimation</code> timeline authoring that mixes{' '}
          <code>from</code> / <code>to</code> boundaries with a <code>50%</code>{' '}
          percentage keyframe. <code>from</code> normalizes to <code>0%</code>,{' '}
          <code>to</code> normalizes to <code>100%</code>. The top-level{' '}
          <code>from</code> / <code>to</code> below are intentionally present
          and MUST be ignored because <code>timeline</code> takes precedence.
        </>
      }
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
        <MixedScene key={key} log={log} />
        <Log
          lines={[
            'timeline.from (0%): y 24 scale 0.8 opacity 0',
            'timeline 50%: y 12 scale 1.1 opacity 0.5',
            'timeline.to (100%): y 0 scale 1 opacity 1',
            'top-level from/to present but IGNORED (timeline precedence)',
            ...lines,
          ]}
        />
      </section>
    </SpatialElementMotionPageShell>
  )
}

function MixedScene({ log }: { log: (msg: string) => void }) {
  const [motion, api, style] = useAnimation({
    // Top-level from/to are intentionally provided to verify they are ignored
    // when a timeline is present.
    from: { opacity: 1 },
    to: { opacity: 1 },
    timeline: MIXED_TIMELINE,
    duration: DURATION,
    autoStart: true,
    timingFunction: 'easeOut',
    onStart: () => log('mixed: onStart'),
    onComplete: values => log(`mixed: onComplete -> ${fmtValues(values)}`),
    onStop: values => log(`mixed: onStop -> ${fmtValues(values)}`),
    onReset: values => log(`mixed: onReset -> ${fmtValues(values)}`),
    onError: err => log(`mixed: onError -> ${err.reason}`),
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PlayStateBadge state={api.playState} />
        <span className="text-xs font-mono text-gray-500">
          xr-animation={motion ? 'yes' : 'no'} - duration={DURATION}s
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => api.play()}>
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
          background: 'linear-gradient(135deg, #3a1e5f, #5a2d87)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
          Mixed Timeline
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-3 font-mono text-xs text-gray-300">
        style: opacity={String(style.opacity ?? '-')} transform=
        {String(style.transform ?? '-')}
      </div>
    </>
  )
}
