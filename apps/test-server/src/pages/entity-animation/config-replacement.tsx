import { useRef, useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import type { EntityMotionConfig } from '@webspatial/core-sdk'
import {
  EntityAnimationPageShell,
  EntityPropsPanel,
  Log,
  btnCls,
  btnPrimary,
  fmtVec3,
  useLog,
} from './shared'

function InPlaceUpdateScene({
  duration,
  playbackRate,
  useTimeline,
  reverse,
  callbackVersion,
  mountGeneration,
  onRetarget,
}: {
  duration: number
  playbackRate: number
  useTimeline: boolean
  reverse: boolean
  callbackVersion: number
  mountGeneration: number
  onRetarget: (
    field: 'duration' | 'playbackRate' | 'timeline' | 'reverse',
  ) => void
}) {
  const logger = useLog()
  const [lastRetargetState, setLastRetargetState] = useState('none')
  const [startCount, setStartCount] = useState(0)
  const [completeCount, setCompleteCount] = useState(0)
  const boundaries = useTimeline
    ? {
        timeline: {
          from: { position: { x: -0.12, y: 0, z: 0 } },
          '50%': { position: { x: 0, y: 0.06, z: 0 } },
          to: { position: { x: 0.12, y: 0, z: 0 } },
        },
      }
    : {
        from: { position: { x: -0.12, y: 0, z: 0 } },
        to: { position: { x: 0.12, y: 0, z: 0 } },
      }
  const config: EntityMotionConfig = {
    ...boundaries,
    duration,
    playbackRate,
    loop: reverse ? { reverse: true } : false,
    autoStart: false,
    onStart: value => {
      setStartCount(count => count + 1)
      logger.log(
        `onStart callback-v${callbackVersion} pos=${fmtVec3(value.position)}`,
      )
    },
    onComplete: value => {
      setCompleteCount(count => count + 1)
      logger.log(`onComplete pos=${fmtVec3(value.position)}`)
    },
    onStop: value => logger.log(`onStop pos=${fmtVec3(value.position)}`),
    onError: error => logger.log(`onError [${error.code}] ${error.reason}`),
  }
  const [animation, api, entityProps] = useEntityAnimation(config)
  // Public API exposes an opaque object, so this page observes React identity only.
  const initialAnimation = useRef(animation)
  const animationStable = initialAnimation.current === animation
  const retarget = (
    field: 'duration' | 'playbackRate' | 'timeline' | 'reverse',
  ) => {
    setLastRetargetState(api.playState)
    logger.log(`retarget ${field} while ${api.playState}`)
    onRetarget(field)
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
      <div
        data-testid="entity-motion-config"
        data-webspatial-animation-stable={String(animationStable)}
        data-webspatial-mount-generation={String(mountGeneration)}
        data-webspatial-last-retarget-state={lastRetargetState}
        data-webspatial-start-count={String(startCount)}
        data-webspatial-complete-count={String(completeCount)}
        className="mb-3 font-mono text-xs text-gray-400"
      >
        duration={duration} timeline={String(useTimeline)} reverse=
        {String(reverse)} playbackRate={playbackRate} callbackVersion=
        {callbackVersion} playState={api.playState} animationStable=
        {String(animationStable)} mountGeneration={mountGeneration}
        <br />
        lastRetargetState={lastRetargetState} startCount={startCount}{' '}
        completeCount={completeCount}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={() => api.play()}>
          Play
        </button>
        <button className={btnCls} onClick={() => api.pause()}>
          Pause
        </button>
        <button className={btnCls} onClick={() => api.stop()}>
          Stop
        </button>
        <button className={btnCls} onClick={() => api.finish()}>
          Finish
        </button>
        <button className={btnCls} onClick={() => retarget('duration')}>
          Retarget duration
        </button>
        <button className={btnCls} onClick={() => retarget('playbackRate')}>
          Retarget playbackRate
        </button>
        <button className={btnCls} onClick={() => retarget('timeline')}>
          Retarget timeline
        </button>
        <button className={btnCls} onClick={() => retarget('reverse')}>
          Retarget reverse loop
        </button>
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
      <p className="mt-3 text-xs text-gray-500">
        Retarget while running or paused. The pose must remain continuous,
        paused retarget must stay paused, and stale completion must not
        increment completeCount.
      </p>
    </section>
  )
}

export default function EntityAnimationConfigReplacementPage() {
  const [duration, setDuration] = useState(2)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [useTimeline, setUseTimeline] = useState(false)
  const [reverse, setReverse] = useState(false)
  const [callbackVersion, setCallbackVersion] = useState(1)
  const [mounted, setMounted] = useState(true)
  const [mountGeneration, setMountGeneration] = useState(1)
  const retarget = (
    field: 'duration' | 'playbackRate' | 'timeline' | 'reverse',
  ) => {
    if (field === 'duration') setDuration(value => value + 1)
    if (field === 'playbackRate')
      setPlaybackRate(value => (value === 1 ? 2 : 1))
    if (field === 'timeline') setUseTimeline(value => !value)
    if (field === 'reverse') setReverse(value => !value)
  }

  return (
    <EntityAnimationPageShell
      title="In-place Config Update"
      description="Execution-field changes retarget the current binding in place. Callback-only changes refresh callbacks without changing the execution definition. Unmount/remount starts a new binding lifecycle."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={btnCls}
          onClick={() => setCallbackVersion(value => value + 1)}
        >
          Callback only update
        </button>
        <button
          className={btnCls}
          onClick={() => {
            if (mounted) {
              setMounted(false)
              return
            }
            setMountGeneration(value => value + 1)
            setMounted(true)
          }}
        >
          {mounted ? 'Unmount' : 'Remount'}
        </button>
      </div>
      {mounted ? (
        <InPlaceUpdateScene
          duration={duration}
          playbackRate={playbackRate}
          useTimeline={useTimeline}
          reverse={reverse}
          callbackVersion={callbackVersion}
          mountGeneration={mountGeneration}
          onRetarget={retarget}
        />
      ) : (
        <div data-testid="entity-motion-unmounted">PASS: scene unmounted</div>
      )}
    </EntityAnimationPageShell>
  )
}
