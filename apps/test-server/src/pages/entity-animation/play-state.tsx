import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationPlayStatePage() {
  const logger = useLog()

  const [animation, api] = useEntityAnimation({
    from: {
      position: { x: -0.2, y: 0, z: 0 },
      scale: { x: 0.5, y: 0.5, z: 0.5 },
    },
    to: {
      position: { x: 0.2, y: 0, z: 0 },
      // Keep scale values non-negative to satisfy useAnimation validation.
      scale: { x: 1, y: 1, z: 1 },
    },
    duration: 4.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => logger.log(`[cb] onStart — playState=${api.playState}`),
    onComplete: () =>
      logger.log(`[cb] onComplete — playState=${api.playState}`),
    onCancel: () => logger.log(`[cb] onCancel — playState=${api.playState}`),
  })

  const logState = (action: string) => {
    logger.log(
      `${action} → playState=${api.playState} isAnimating=${api.isAnimating} isPaused=${api.isPaused} finished=${api.finished}`,
    )
  }

  return (
    <EntityAnimationPageShell
      title="PlayState Inspector"
      description={
        <>
          Verify <code className="text-cyan-300">api.playState</code>{' '}
          transitions: idle → running → paused → running → finished, and idle →
          running → idle (cancel). The state badge updates on every render.
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
              api.cancel()
              logState('cancel()')
            }}
          >
            Cancel
          </button>
          <button className={btnCls} onClick={() => logState('query')}>
            Query State
          </button>
          <button className={btnCls} onClick={logger.clear}>
            Clear log
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String(api.isAnimating)} &nbsp; isPaused=
            {String(api.isPaused)} &nbsp; finished={String(api.finished)}
          </span>
        </div>

        <Reality style={{ width: '100%', height: '220px' }}>
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              // position={{ x: 0, y: 0, z: 0 }}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <Log lines={logger.lines} />

        <div className="mt-4 rounded-lg border border-gray-800 bg-black/30 p-4 text-xs text-gray-500">
          <h4 className="mb-2 font-medium text-gray-400">
            Expected state transitions
          </h4>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Play:</strong> idle → running (or queued → running if
              entity not yet bound)
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
    </EntityAnimationPageShell>
  )
}

function PlayStateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    idle: 'bg-gray-700 text-gray-300',
    queued: 'bg-yellow-900 text-yellow-300',
    running: 'bg-green-900 text-green-300',
    paused: 'bg-orange-900 text-orange-300',
    finished: 'bg-blue-900 text-blue-300',
  }
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${colors[state] ?? 'bg-gray-700 text-gray-300'}`}
    >
      {state}
    </span>
  )
}
