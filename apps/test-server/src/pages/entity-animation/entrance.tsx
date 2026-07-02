import { useState } from 'react'
import {
  BoxEntity,
  Reality,
  SceneGraph,
  useEntityAnimation,
} from '@webspatial/react-sdk'
import {
  EntityAnimationPageShell,
  Log,
  fmtVec3,
  btnCls,
  useLog,
} from './shared'

function EntranceAnimationScene({
  onStart,
  onComplete,
  onError,
}: {
  onStart: () => void
  onComplete: (value: {
    position?: { x: number; y: number; z: number }
    scale?: { x: number; y: number; z: number }
  }) => void
  onError: (error: { command: string; reason: string }) => void
}) {
  const [animation] = useEntityAnimation({
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
    onError,
  })

  return (
    <Reality style={{ width: '100%', height: '260px' }}>
      <SceneGraph>
        <BoxEntity width={0.1} height={0.1} depth={0.1} animation={animation} />
      </SceneGraph>
    </Reality>
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
          onError={error =>
            logger.log(`onError [${error.command}] ${error.reason}`)
          }
        />
        <Log lines={logger.lines} />
      </section>
    </EntityAnimationPageShell>
  )
}
