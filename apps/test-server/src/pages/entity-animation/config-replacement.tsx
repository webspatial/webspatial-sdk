import { useState } from 'react'
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

function ReplacementScene({
  duration,
  playbackRate,
  useTimeline,
  reverse,
  callbackVersion,
}: {
  duration: number
  playbackRate: number
  useTimeline: boolean
  reverse: boolean
  callbackVersion: number
}) {
  const logger = useLog()
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
    onStart: value =>
      logger.log(
        `onStart callback-v${callbackVersion} pos=${fmtVec3(value.position)}`,
      ),
    onComplete: value =>
      logger.log(`onComplete pos=${fmtVec3(value.position)}`),
    onStop: value => logger.log(`onStop pos=${fmtVec3(value.position)}`),
    onError: error => logger.log(`onError [${error.code}] ${error.reason}`),
  }
  const [animation, api, entityProps] = useEntityAnimation(config)

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
      <div
        data-testid="entity-motion-config"
        className="mb-3 font-mono text-xs text-gray-400"
      >
        duration={duration} timeline={String(useTimeline)} reverse=
        {String(reverse)} playbackRate={playbackRate} callbackVersion=
        {callbackVersion} playState={api.playState}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={() => api.play()}>
          Play
        </button>
        <button className={btnCls} onClick={() => api.stop()}>
          Stop
        </button>
        <button className={btnCls} onClick={() => api.finish()}>
          Finish
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

  return (
    <EntityAnimationPageShell
      title="Config Replacement"
      description="Change execution fields to replace the native object; callback-only changes keep it. Unmount/remount checks teardown and pose handoff."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={btnCls}
          onClick={() => setDuration(value => value + 1)}
        >
          Change duration
        </button>
        <button
          className={btnCls}
          onClick={() => setPlaybackRate(value => (value === 1 ? 2 : 1))}
        >
          Toggle playbackRate
        </button>
        <button
          className={btnCls}
          onClick={() => setUseTimeline(value => !value)}
        >
          Toggle timeline
        </button>
        <button className={btnCls} onClick={() => setReverse(value => !value)}>
          Toggle reverse loop
        </button>
        <button
          className={btnCls}
          onClick={() => setCallbackVersion(value => value + 1)}
        >
          Callback only update
        </button>
        <button className={btnCls} onClick={() => setMounted(value => !value)}>
          {mounted ? 'Unmount' : 'Remount'}
        </button>
      </div>
      {mounted ? (
        <ReplacementScene
          duration={duration}
          playbackRate={playbackRate}
          useTimeline={useTimeline}
          reverse={reverse}
          callbackVersion={callbackVersion}
        />
      ) : (
        <div data-testid="entity-motion-unmounted">PASS: scene unmounted</div>
      )}
    </EntityAnimationPageShell>
  )
}
