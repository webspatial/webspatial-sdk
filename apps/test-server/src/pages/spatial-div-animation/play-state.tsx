import { useAnimation } from '@webspatial/react-sdk'
import {
  SpatialDivAnimationPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function SpatialDivPlayStatePage() {
  const { lines, log, clear } = useLog()

  const [animation, api] = useAnimation({
    from: { opacity: 1.0 },
    to: { opacity: 0.0 },
    duration: 4.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => log(`[cb] onStart — playState=${(api as any).playState}`),
    onComplete: () =>
      log(`[cb] onComplete — playState=${(api as any).playState}`),
    onCancel: () => log(`[cb] onCancel — playState=${(api as any).playState}`),
  } as any)

  const logState = (action: string) => {
    const a = api as any
    log(
      `${action} → playState=${a.playState} isAnimating=${a.isAnimating} isPaused=${a.isPaused} finished=${a.finished}`,
    )
  }

  return (
    <SpatialDivAnimationPageShell
      title="PlayState Inspector"
      description={
        <>
          Verify <code className="text-cyan-300">api.playState</code>{' '}
          transitions: idle → running → paused → running → finished, and idle →
          running → idle (cancel). Uses opacity 1→0 over 4s for an easy
          observation window.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            onClick={() => {
              ;(api as any).play()
              logState('play()')
            }}
          >
            Play
          </button>
          <button
            className={btnCls}
            onClick={() => {
              ;(api as any).pause()
              logState('pause()')
            }}
          >
            Pause
          </button>
          <button
            className={btnCls}
            onClick={() => {
              ;(api as any).cancel()
              logState('cancel()')
            }}
          >
            Cancel
          </button>
          <button className={btnCls} onClick={() => logState('query')}>
            Query State
          </button>
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <PlayStateBadge state={(api as any).playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String((api as any).isAnimating)} &nbsp; isPaused=
            {String((api as any).isPaused)} &nbsp; finished=
            {String((api as any).finished)}
          </span>
        </div>

        <div
          enable-xr
          animation={animation as any}
          style={{
            width: 240,
            height: 140,
            marginTop: 16,
            background: 'linear-gradient(135deg, #1e5f3a, #2d8754)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
              <strong>Cancel:</strong> running/paused → idle
            </li>
            <li>
              <strong>Play after finished:</strong> finished → running (new
              session)
            </li>
          </ul>
        </div>
      </section>
    </SpatialDivAnimationPageShell>
  )
}
