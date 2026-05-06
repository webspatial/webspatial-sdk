import { useState } from 'react'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  useAnimation,
} from '@webspatial/react-sdk'
import {
  EntityAnimationPageShell,
  Log,
  type Vec3,
  fmtVec3,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationStopSyncPage() {
  const logger = useLog()
  const [position, setPosition] = useState<Vec3>({ x: 0, y: 0.5, z: 0 })

  const [animation, api] = useAnimation({
    from: { position: { x: -0.1, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 3.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => logger.log('onStart'),
    onComplete: value => {
      logger.log(`onComplete pos=${fmtVec3(value.position)}`)
      if (value.position) setPosition(value.position)
    },
    onStop: value => {
      logger.log(`onStop pos=${fmtVec3(value.position)}`)
      if (value.position) setPosition(value.position)
    },
    onError: error => logger.log(`onError [${error.command}] ${error.reason}`),
  })

  return (
    <EntityAnimationPageShell
      title="Stop and Sync State"
      description="Stop the animation mid-flight and mirror the reported position back into React state so the next render stays stable."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            onClick={() => {
              api.play()
              logger.log('play()')
            }}
          >
            Play
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
          <button className={btnCls} onClick={logger.clear}>
            Clear log
          </button>
        </div>
        <div className="mt-3 text-xs font-mono text-gray-500">
          synced position={fmtVec3(position)} &nbsp; isAnimating=
          {String(api.isAnimating)}
        </div>
        <Reality style={{ width: '100%', height: '220px' }}>
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              position={position}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <Log lines={logger.lines} />
      </section>
    </EntityAnimationPageShell>
  )
}
