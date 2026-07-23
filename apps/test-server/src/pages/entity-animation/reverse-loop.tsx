import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationReverseLoopPage() {
  const logger = useLog()

  const [animation, api] = useEntityAnimation({
    from: { rotation: { x: 0, y: 0, z: 0 } },
    to: { rotation: { x: 0, y: 170, z: 0 } },
    duration: 2.0,
    timingFunction: 'linear',
    loop: { reverse: true },
    onStart: () => logger.log('onStart (loop)'),
    onError: error => logger.log(`onError [${error.command}] ${error.reason}`),
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
        <div className="flex flex-wrap gap-2">
          <button className={btnPrimary} onClick={toggle}>
            {api.isPaused ? 'Resume' : api.isAnimating ? 'Pause' : 'Play'}
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
          <button className={btnCls} onClick={logger.clear}>
            Clear log
          </button>
        </div>
        <div className="mt-3 text-xs font-mono text-gray-500">
          isAnimating={String(api.isAnimating)} &nbsp; isPaused=
          {String(api.isPaused)}
        </div>
        <Reality style={{ width: '100%', height: '220px' }}>
          <SceneGraph>
            <BoxEntity
              width={0.1}
              height={0.1}
              depth={0.1}
              animation={animation}
            />
          </SceneGraph>
        </Reality>
        <Log lines={logger.lines} />
      </section>
    </EntityAnimationPageShell>
  )
}
