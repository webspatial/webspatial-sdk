import { useAnimation } from '@webspatial/react-sdk/experimental'
import {
  SpatialElementMotionPageShell,
  Log,
  PlayStateBadge,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

export default function ReverseLoopPage() {
  const { lines, log, clear } = useLog()

  const [motion, api, style] = useAnimation({
    from: { transform: { translate: { x: -80 } } },
    to: { transform: { translate: { x: 80 } } },
    duration: 1.5,
    timingFunction: 'linear',
    loop: { reverse: true },
    autoStart: false,
    onStart: () => log('reverse-loop: onStart'),
    onReset: () => log('reverse-loop: onReset'),
    onError: err => log(`reverse-loop: onError → ${err.reason}`),
  })

  const toggle = () => {
    if (api.isPaused) {
      api.play()
      log('play() [resume]')
      return
    }
    if (api.isAnimating) {
      api.pause()
      log('pause()')
      return
    }
    api.play()
    log('play()')
  }

  return (
    <SpatialElementMotionPageShell
      title="Reverse Loop (Ping-Pong)"
      description="loop: { reverse: true } makes translate.x ping-pong between -80 and 80. The toggle button drives play / pause / resume on the same session."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          xr-animation={motion}
          style={{
            width: 180,
            height: 120,
            background: 'linear-gradient(135deg, #1a4a8a, #3a7aed)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <span style={{ color: 'white', fontSize: 16 }}>Ping Pong</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button className={btnPrimary} onClick={toggle}>
            {api.isPaused ? 'Resume' : api.isAnimating ? 'Pause' : 'Play'}
          </button>
          <button
            className={btnCls}
            onClick={() => {
              api.reset()
              log('reset()')
            }}
          >
            Reset
          </button>
          <button className={btnCls} onClick={clear}>
            Clear Log
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PlayStateBadge state={api.playState} />
          <span className="text-xs font-mono text-gray-500">
            isAnimating={String(api.isAnimating)} &nbsp; isPaused=
            {String(api.isPaused)}
          </span>
        </div>
        <Log lines={lines} />
      </section>
    </SpatialElementMotionPageShell>
  )
}
