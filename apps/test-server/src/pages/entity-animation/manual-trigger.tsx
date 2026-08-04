import { useState } from 'react'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
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

export default function EntityAnimationManualTriggerPage() {
  const logger = useLog()
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [reactPosition, setReactPosition] = useState({ x: 0, y: 0, z: 0 })
  const [reactRotation, setReactRotation] = useState({ x: 0, y: 0, z: 0 })
  const [reactScale, setReactScale] = useState({ x: 1, y: 1, z: 1 })

  const [animation, api, entityProps] = useEntityAnimation({
    from: { position: { x: -0.1, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 3.0,
    delay: 1.0,
    timingFunction: 'easeInOut',
    playbackRate,
    autoStart: false,
    onStart: () => logger.log('onStart'),
    onComplete: value =>
      logger.log(`onComplete pos=${fmtVec3(value.position)}`),
    onStop: value => logger.log(`onStop pos=${fmtVec3(value.position)}`),
    onReset: value => logger.log(`onReset pos=${fmtVec3(value.position)}`),
    onError: error => logger.log(`onError [${error.code}] ${error.reason}`),
  })

  return (
    <EntityAnimationPageShell
      title="Manual Trigger"
      description="Use the React transform probes during delay, running, paused, and terminal states. Native must block the probes while active and accept later probe changes after playback becomes inactive."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            onClick={() => {
              api.play()
              logger.log(`play() rate=${playbackRate}`)
            }}
          >
            Play
          </button>
          <button
            className={btnCls}
            onClick={() => {
              api.pause()
              logger.log('pause()')
            }}
          >
            Pause
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
              api.set({ position: { y: 0.06 } })
              logger.log('api.set(y=0.06) requested; see entityProps')
            }}
          >
            api.set(y = 0.06)
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setReactPosition(value => ({ ...value, x: value.x + 0.1 }))
              logger.log('React position.x += 0.1')
            }}
          >
            React position.x += 0.1
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setReactRotation(value => ({ ...value, y: value.y + 45 }))
              logger.log('React rotation.y += 45')
            }}
          >
            React rotation.y += 45
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setReactScale(value => {
                const next = value.x === 1 ? 1.5 : 1
                return { x: next, y: next, z: next }
              })
              logger.log('Toggle React scale')
            }}
          >
            Toggle React scale
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setReactPosition({ x: 0, y: 0, z: 0 })
              setReactRotation({ x: 0, y: 0, z: 0 })
              setReactScale({ x: 1, y: 1, z: 1 })
              logger.log('Reset React transform probes')
            }}
          >
            Reset React probes
          </button>
          <button className={btnCls} onClick={logger.clear}>
            Clear log
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs text-gray-400">playbackRate:</label>
          {[0.25, 0.5, 1, 2, 4].map(rate => (
            <button
              key={rate}
              className={`px-2 py-1 text-xs rounded ${
                playbackRate === rate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => {
                setPlaybackRate(rate)
                logger.log(`setPlaybackRate(${rate})`)
              }}
            >
              {rate}x
            </button>
          ))}
        </div>

        <div
          data-webspatial-play-state={api.playState}
          data-webspatial-react-position={JSON.stringify(reactPosition)}
          data-webspatial-react-rotation={JSON.stringify(reactRotation)}
          data-webspatial-react-scale={JSON.stringify(reactScale)}
          className="mt-3 text-xs font-mono text-gray-500"
        >
          isAnimating={String(api.isAnimating)} &nbsp; isPaused=
          {String(api.isPaused)} &nbsp; playState={api.playState} &nbsp;
          playbackRate={playbackRate}
          <br />
          React position={fmtVec3(reactPosition)} rotation=
          {fmtVec3(reactRotation)} scale={fmtVec3(reactScale)}
        </div>
        <Reality style={{ width: '100%', height: '220px' }}>
          <UnlitMaterial id="matRed" color="#ff0000" />
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              materials={['matRed']}
              {...entityProps}
              position={reactPosition}
              rotation={reactRotation}
              scale={reactScale}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <EntityPropsPanel entityProps={entityProps} />
        <Log lines={logger.lines} />
        <p className="mt-3 text-xs text-gray-500">
          This probe intentionally applies React transform props after
          entityProps. During delay, running, or paused playback the box must
          ignore probe changes. After stop, reset, finish, or natural
          completion, the next probe change must update the box.
        </p>
      </section>
    </EntityAnimationPageShell>
  )
}
