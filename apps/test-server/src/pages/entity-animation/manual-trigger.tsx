import { useState } from 'react'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  UnlitMaterial,
  useEntityAnimation,
} from '@webspatial/react-sdk'
import {
  EntityAnimationPageShell,
  Log,
  fmtVec3,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationManualTriggerPage() {
  const logger = useLog()
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [posX, setPosX] = useState(0)

  const [animation, api] = useEntityAnimation({
    from: { position: { x: -0.1, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 3.0,
    timingFunction: 'easeInOut',
    playbackRate,
    autoStart: false,
    onStart: () => logger.log('onStart'),
    onComplete: value =>
      logger.log(`onComplete pos=${fmtVec3(value.position)}`),
    onCancel: value => logger.log(`onCancel pos=${fmtVec3(value.position)}`),
    onError: error => logger.log(`onError [${error.command}] ${error.reason}`),
  })

  return (
    <EntityAnimationPageShell
      title="Manual Trigger"
      description="This case keeps autoStart disabled so playback is fully controlled through the API buttons. Adjust playbackRate before pressing Play."
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
              api.cancel()
              logger.log('cancel()')
            }}
          >
            Cancel
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setPosX(prev => {
                const next = Math.round((prev + 0.1) * 1000) / 1000
                logger.log(`setPosX(${next})`)
                return next
              })
            }}
          >
            X += 0.1
          </button>
          <button
            className={btnCls}
            onClick={() => {
              setPosX(0)
              logger.log('setPosX(0)')
            }}
          >
            X = 0
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

        <div className="mt-3 text-xs font-mono text-gray-500">
          isAnimating={String(api.isAnimating)} &nbsp; isPaused=
          {String(api.isPaused)} &nbsp; playbackRate={playbackRate} &nbsp; posX=
          {posX}
        </div>
        <Reality style={{ width: '100%', height: '220px' }}>
          <UnlitMaterial id="matRed" color="#ff0000" />
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              position={{ x: posX, y: 0, z: 0 }}
              materials={['matRed']}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <Log lines={logger.lines} />
      </section>
    </EntityAnimationPageShell>
  )
}
