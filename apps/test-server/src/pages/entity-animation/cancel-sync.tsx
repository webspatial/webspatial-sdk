import { useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  EntityPropsPanel,
  Log,
  type Vec3,
  fmtVec3,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationCancelSyncPage() {
  const logger = useLog()
  const [position, setPosition] = useState<Vec3>({ x: 0, y: 0, z: 0 })

  const [animation, api, entityProps] = useEntityAnimation({
    from: { position: { x: -0.1, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 3.0,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => logger.log('onStart'),
    onComplete: value => {
      logger.log(`onComplete pos=${fmtVec3(value.position)}`)
    },
    onStop: value => {
      if (value.position) setPosition(value.position)
      logger.log(`onStop pos=${fmtVec3(value.position)}`)
    },
    onError: error => logger.log(`onError [${error.code}] ${error.reason}`),
  })

  return (
    <EntityAnimationPageShell
      title="Stop and Sync State"
      description="Stop the animation and mirror the native-confirmed stop position back into React state so the next render stays stable."
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
          <button
            className={btnCls}
            onClick={() => {
              api.set({ position: { y: 0.05 } })
              logger.log('api.set(y=0.05) requested; see entityProps')
            }}
          >
            api.set(y = 0.05)
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
