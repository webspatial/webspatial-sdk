import { useAnimation } from '@webspatial/react-sdk/experimental'
import {
  SpatialElementMotionPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function SpatializedMotionPlayStatePage() {
  const { lines, log, clear } = useLog()

  const [motion, api, style] = useAnimation({
    from: { opacity: 1.0 },
    to: { opacity: 0.0 },
    duration: 4.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log(`[cb] onStart — playState=${api.playState}`),
    onComplete: () => log(`[cb] onComplete — playState=${api.playState}`),
    onReset: () => log(`[cb] onReset — playState=${api.playState}`),
  })

  const logState = (action: string) => {
    log(
      `${action} → playState=${api.playState} isAnimating=${api.isAnimating} isPaused=${api.isPaused} finished=${api.finished}`,
    )
  }

  return (
    <SpatialElementMotionPageShell
      title="PlayState Inspector"
      description={
        <>
          Verify <code className="text-cyan-300">api.playState</code>{' '}
          transitions: idle → running → paused → running → finished, and idle →
          running → idle (reset). Uses opacity 1→0 over 4s for an easy
          observation window.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            onClick={() => {
              api.play()
              logState('play()')
            }}
          >
            Play
          </button>
          <button
            className={btnCls}
            onClick={() => {
              api.pause()
              logState('pause()')
            }}
          >
            Pause
          </button>
          <button
            className={btnCls}
            onClick={() => {
              api.reset()
              logState('reset()')
            }}
          >
            Reset
          </button>
          <button className={btnCls} onClick={() => logState('query')}>
            Query State
          </button>
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String(api.isAnimating)} &nbsp; isPaused=
            {String(api.isPaused)} &nbsp; finished={String(api.finished)}
          </span>
        </div>

        <div
          enable-xr
          xr-animation={motion}
          style={{
            width: 240,
            height: 140,
            marginTop: 16,
            background: 'linear-gradient(135deg, #1e5f3a, #2d8754)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span style={{ color: 'white', fontSize: 14 }}>State Probe</span>
        </div>

        <Log lines={lines} />

        <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-4 text-xs text-gray-500">
          <h4 className="mb-2 font-medium text-gray-400">
            Expected state transitions
          </h4>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Play:</strong> idle → running (or queued → running if
              element not yet bound)
            </li>
            <li>
              <strong>Pause:</strong> running → paused
            </li>
            <li>
              <strong>Play (resume):</strong> paused → running
            </li>
            <li>
              <strong>Wait for end:</strong> running → finished
            </li>
            <li>
              <strong>Reset:</strong> running/paused → idle
            </li>
            <li>
              <strong>Play after finished:</strong> finished → running (new
              session)
            </li>
          </ul>
        </div>
      </section>
    </SpatialElementMotionPageShell>
  )
}
