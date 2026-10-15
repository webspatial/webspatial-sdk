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

export default function EntityAnimationResetLoopPage() {
  const logger = useLog()

  const [animation, api, entityProps] = useEntityAnimation({
    from: { position: { x: 0, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 1.2,
    timingFunction: 'easeIn',
    loop: true,
    onStart: () => logger.log('onStart (reset loop)'),
    onReset: value => logger.log(`onReset pos=${fmtVec3(value.position)}`),
    onStop: value => logger.log(`onStop pos=${fmtVec3(value.position)}`),
    onError: error => logger.log(`onError [${error.code}] ${error.reason}`),
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
                api.reset()
                logger.log('reset()')
                return
              }

              api.play()
              logger.log('play()')
            }}
          >
            {api.isAnimating ? 'Reset' : 'Play'}
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
              api.set({ position: { y: 0.04 } })
              logger.log('api.set(y=0.04) requested; see entityProps')
            }}
          >
            api.set(y = 0.04)
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
              position={{ x: 0, y: 0, z: 0 }}
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
