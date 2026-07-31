import { useRef, useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import type { EntityRefShape } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  EntityPropsPanel,
  Log,
  fmtVec3,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationPlayStatePage() {
  const logger = useLog()
  const entityRef = useRef<EntityRefShape>(null)
  const [targetDestroyed, setTargetDestroyed] = useState(false)
  const [onErrorCount, setOnErrorCount] = useState(0)

  const [animation, api, entityProps] = useEntityAnimation({
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
    onStop: value =>
      logger.log(
        `[cb] onStop — playState=${api.playState} pos=${fmtVec3(value.position)}`,
      ),
    onReset: value =>
      logger.log(
        `[cb] onReset — playState=${api.playState} pos=${fmtVec3(value.position)}`,
      ),
    onError: error => {
      setOnErrorCount(count => count + 1)
      logger.log(`[cb] onError [${error.code}] ${error.reason}`)
    },
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
          running → idle after stop or reset. The state badge updates on every
          render.
        </>
      }
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          data-name="Entity Motion Play State Controls"
          data-webspatial-play-state={api.playState}
          data-webspatial-is-animating={String(api.isAnimating)}
          data-webspatial-is-paused={String(api.isPaused)}
          data-webspatial-finished={String(api.finished)}
          data-webspatial-target-destroyed={String(targetDestroyed)}
          data-webspatial-on-error-count={String(onErrorCount)}
          data-webspatial-entity-props={JSON.stringify(entityProps)}
          className="rounded-xl border border-gray-800 p-3"
        >
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
                api.stop()
                logState('stop()')
              }}
            >
              Stop
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
            <button
              className={btnCls}
              onClick={() => {
                api.finish()
                logState('finish()')
              }}
            >
              Finish
            </button>
            <button
              className={btnCls}
              onClick={() => {
                api.set({ scale: { x: 0.75, y: 0.75, z: 0.75 } })
                logger.log('api.set(scale=0.75) requested; see entityProps')
              }}
            >
              api.set(scale = 0.75)
            </button>
            <button
              data-name="entity-motion-destroy-target"
              className={btnCls}
              onClick={() => {
                entityRef.current?.entity?.destroy()
                setTargetDestroyed(true)
                logger.log('target Entity destroy() requested')
              }}
            >
              Destroy target
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
              &nbsp; targetDestroyed={String(targetDestroyed)} &nbsp;
              onErrorCount={onErrorCount}
            </span>
          </div>
        </div>

        <Reality
          data-name="Entity Motion Play State Reality"
          style={{ width: '100%', height: '220px' }}
        >
          <SceneGraph>
            <BoxEntity
              ref={entityRef}
              width={0.1}
              height={0.1}
              depth={0.1}
              position={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
              {...entityProps}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <EntityPropsPanel entityProps={entityProps} />
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
              <strong>Stop:</strong> running/paused → idle with the current
              confirmed pose
            </li>
            <li>
              <strong>Reset:</strong> running/paused/finished → idle at the
              configured start pose
            </li>
            <li>
              <strong>Finish:</strong> running/paused/idle → finished at the
              configured end pose
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
