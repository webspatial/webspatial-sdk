import {
  BoxEntity,
  Reality,
  SceneGraph,
  useEntityAnimation,
} from '@webspatial/react-sdk'
import {
  EntityAnimationPageShell,
  Log,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function EntityAnimationResetLoopPage() {
  const logger = useLog()

  const [animation, api] = useEntityAnimation({
    from: { position: { x: 0, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 1.2,
    timingFunction: 'easeIn',
    loop: true,
    onStart: () => logger.log('onStart (reset loop)'),
    onError: error => logger.log(`onError [${error.command}] ${error.reason}`),
  })

  return (
    <EntityAnimationPageShell
      title="Reset Loop"
      description="This loop mode resets back to the from state after each cycle and immediately replays."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            onClick={() => {
              if (api.isAnimating) {
                api.cancel()
                logger.log('cancel()')
                return
              }

              api.play()
              logger.log('play()')
            }}
          >
            {api.isAnimating ? 'Cancel' : 'Play'}
          </button>
          <button className={btnCls} onClick={logger.clear}>
            Clear log
          </button>
        </div>
        <div className="mt-3 text-xs font-mono text-gray-500">
          isAnimating={String(api.isAnimating)}
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
