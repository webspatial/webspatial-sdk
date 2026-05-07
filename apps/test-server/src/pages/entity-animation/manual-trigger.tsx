import {
  BoxEntity,
  Reality,
  SceneGraph,
  useAnimation,
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

  const [animation, api] = useAnimation({
    from: { position: { x: -0.1, y: 0, z: 0 } },
    to: { position: { x: 0.1, y: 0, z: 0 } },
    duration: 3.0,
    timingFunction: 'easeInOut',
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
      description="This case keeps autoStart disabled so playback is fully controlled through the API buttons."
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
