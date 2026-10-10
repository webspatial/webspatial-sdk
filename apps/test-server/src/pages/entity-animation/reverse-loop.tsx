import { useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
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

export default function EntityAnimationReverseLoopPage() {
  const logger = useLog()
  const [delay, setDelay] = useState<0 | 2>(2)

  const [animation, api, entityProps] = useEntityAnimation({
    timeline: {
      from: { rotation: { x: 0, y: 0, z: 0 } },
      '50%': {
        position: { x: 0.04, y: 0.02, z: 0 },
        rotation: { x: 0, y: 85, z: 0 },
        timingFunction: 'easeInOut',
      },
      to: {
        position: { x: 0.08, y: 0, z: 0 },
        rotation: { x: 0, y: 170, z: 0 },
      },
    },
    duration: 2.0,
    delay,
    autoStart: false,
    timingFunction: 'linear',
    loop: { reverse: true },
    onStart: () => logger.log('onStart (loop)'),
    onStop: value => logger.log(`onStop rot=${fmtVec3(value.rotation)}`),
    onError: error => logger.log(`onError [${error.code}] ${error.reason}`),
  })

  const toggle = () => {
    if (api.isPaused) {
      api.play()
      logger.log('play() [resume]')
      return
    }

    if (api.isAnimating) {
      api.pause()
      logger.log('pause()')
      return
    }

    api.play()
    logger.log('play()')
  }

  return (
    <EntityAnimationPageShell
      title="Reverse Loop"
      description="Infinite reverse-loop rotation from Y 0 to 170 degrees, with pause and resume handled by the same control."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          data-name="Entity Motion Reverse Loop Controls"
          data-webspatial-play-state={api.playState}
          data-webspatial-is-animating={String(api.isAnimating)}
          data-webspatial-is-paused={String(api.isPaused)}
          data-webspatial-entity-props={JSON.stringify(entityProps)}
          className="rounded-xl border border-gray-800 p-3"
        >
          <div className="flex flex-wrap gap-2">
            {/* Keep delay choices aligned with the scenarios under test. */}
            <label className="flex items-center gap-2 text-sm text-gray-300">
              Delay
              <select
                className={btnCls}
                value={delay}
                onChange={event => {
                  const nextDelay = Number(event.target.value) as 0 | 2
                  setDelay(nextDelay)
                  logger.log(`delay=${nextDelay}s`)
                }}
              >
                <option value={0}>0s</option>
                <option value={2}>2s</option>
              </select>
            </label>
            <button className={btnPrimary} onClick={toggle}>
              {api.isPaused ? 'Resume' : api.isAnimating ? 'Pause' : 'Play'}
            </button>
            <button
              className={btnCls}
              onClick={() => {
                api.stop()
                logger.log('stop()')
              }}
            >
              Stop
            </button>
            {/* Exercise terminal state transitions for the reverse loop. */}
            <button
              className={btnCls}
              onClick={() => {
                api.reset()
                logger.log('reset()')
              }}
            >
              Reset
            </button>
            <button
              className={btnCls}
              onClick={() => {
                api.finish()
                logger.log('finish()')
              }}
            >
              Finish
            </button>
            <button
              className={btnCls}
              onClick={() => {
                api.set({ scale: { x: 1.2, y: 1.2, z: 1.2 } })
                logger.log('api.set(scale=1.2) requested; see entityProps')
              }}
            >
              api.set(scale = 1.2)
            </button>
            <button className={btnCls} onClick={logger.clear}>
              Clear log
            </button>
          </div>
          <div className="mt-3 text-xs font-mono text-gray-500">
            playState={api.playState} &nbsp; isAnimating=
            {String(api.isAnimating)} &nbsp; isPaused={String(api.isPaused)}
          </div>
        </div>
        <Reality
          data-name="Entity Motion Reverse Loop Reality"
          style={{ width: '100%', height: '220px' }}
        >
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              position={{ x: 0, y: 0, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 1, y: 1, z: 1 }}
              {...entityProps}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <EntityPropsPanel entityProps={entityProps} />
        <Log lines={logger.lines} />
      </section>
    </EntityAnimationPageShell>
  )
}
