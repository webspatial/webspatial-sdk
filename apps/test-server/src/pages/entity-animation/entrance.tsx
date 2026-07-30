import { useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  EntityPropsPanel,
  Log,
  fmtVec3,
  btnCls,
  useLog,
} from './shared'

function EntranceAnimationScene({
  onStart,
  onComplete,
  onSetConfirmed,
  onReset,
  onError,
}: {
  onStart: () => void
  onComplete: (value: {
    position?: { x: number; y: number; z: number }
    scale?: { x: number; y: number; z: number }
  }) => void
  onSetConfirmed: () => void
  onReset: (value: {
    position?: { x: number; y: number; z: number }
    scale?: { x: number; y: number; z: number }
  }) => void
  onError: (error: { code: string; reason: string }) => void
}) {
  const [animation, api, entityProps] = useEntityAnimation({
    from: {
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 0.1, y: 0.1, z: 0.1 },
    },
    to: {
      position: { x: 0.1, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    duration: 0.8,
    delay: 0.3,
    timingFunction: 'easeOut',
    autoStart: true,
    onStart,
    onComplete,
    onReset,
    onError,
  })

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={btnCls}
          onClick={() => {
            api.set({ position: { y: 0.06 } })
            onSetConfirmed()
          }}
        >
          api.set(y = 0.06)
        </button>
        <button className={btnCls} onClick={() => api.reset()}>
          Reset to start
        </button>
      </div>
      <div className="mt-3 text-xs font-mono text-gray-500">
        playState={api.playState} &nbsp; isAnimating=
        {String(api.isAnimating)}
      </div>
      <Reality style={{ width: '100%', height: '260px' }}>
        <SceneGraph>
          <BoxEntity
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
    </>
  )
}

export default function EntityAnimationEntrancePage() {
  const logger = useLog()
  const [key, setKey] = useState(0)

  return (
    <EntityAnimationPageShell
      title="Entrance Animation"
      description="autoStart with a 0.3 second delay and easeOut timing. Remount the scene to replay the entrance."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex gap-2">
          <button
            className={btnCls}
            onClick={() => {
              setKey(prev => prev + 1)
              logger.clear()
            }}
          >
            Remount
          </button>
        </div>
        <EntranceAnimationScene
          key={key}
          onStart={() => logger.log('onStart')}
          onComplete={value =>
            logger.log(
              `onComplete pos=${fmtVec3(value.position)} scale=${fmtVec3(value.scale)}`,
            )
          }
          onSetConfirmed={() =>
            logger.log('api.set requested; see entityProps')
          }
          onReset={value =>
            logger.log(
              `onReset pos=${fmtVec3(value.position)} scale=${fmtVec3(value.scale)}`,
            )
          }
          onError={error =>
            logger.log(`onError [${error.code}] ${error.reason}`)
          }
        />
        <Log lines={logger.lines} />
      </section>
    </EntityAnimationPageShell>
  )
}
