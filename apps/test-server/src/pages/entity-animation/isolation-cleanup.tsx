import { useState } from 'react'
import { BoxEntity, Entity, Reality, SceneGraph } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  EntityPropsPanel,
  Log,
  btnCls,
  btnPrimary,
  fmtVec3,
  useLog,
} from './shared'

function IsolatedEntity({ name, y }: { name: 'A' | 'B'; y: number }) {
  const logger = useLog()
  const [animation, api, entityProps] = useEntityAnimation({
    from: { position: { x: -0.12, y, z: 0 } },
    to: { position: { x: 0.12, y, z: 0 } },
    duration: name === 'A' ? 2 : 3,
    loop: { reverse: true },
    autoStart: false,
    onStart: () => logger.log(`${name}:onStart`),
    onStop: value =>
      logger.log(`${name}:onStop pos=${fmtVec3(value.position)}`),
    onError: error =>
      logger.log(`${name}:onError [${error.code}] ${error.reason}`),
  })
  const [childAnimation, childApi, childEntityProps] = useEntityAnimation({
    from: { position: { x: -0.04, y: 0, z: 0 } },
    to: { position: { x: 0.04, y: 0, z: 0 } },
    duration: 0.8,
    loop: { reverse: true },
    autoStart: false,
    onError: error =>
      logger.log(`${name}:child:onError [${error.code}] ${error.reason}`),
  })

  return (
    <div
      data-testid={`entity-motion-isolated-${name.toLowerCase()}`}
      className="rounded-xl border border-gray-800 p-3"
    >
      <div className="mb-2 font-semibold">Entity {name}</div>
      <div
        enable-xr
        data-name={`Entity Motion Isolation ${name} Controls`}
        data-webspatial-parent-state={api.playState}
        data-webspatial-child-state={childApi.playState}
        data-webspatial-parent-props={JSON.stringify(entityProps)}
        data-webspatial-child-props={JSON.stringify(childEntityProps)}
        className="rounded-xl border border-gray-800 p-3"
      >
        <div className="flex gap-2">
          <button
            className={btnPrimary}
            onClick={() => {
              api.play()
              childApi.play()
            }}
          >
            Play {name}
          </button>
          <button className={btnCls} onClick={() => api.stop()}>
            Stop {name}
          </button>
        </div>
        <div className="mt-2 font-mono text-xs">
          parent={api.playState}; child={childApi.playState}
        </div>
      </div>
      <Reality
        data-name={`Entity Motion Isolation ${name} Reality`}
        style={{ width: '100%', height: '180px' }}
      >
        <SceneGraph>
          <Entity
            position={{ x: 0, y, z: 0 }}
            {...entityProps}
            animation={animation}
          >
            <BoxEntity
              width={0.08}
              height={0.08}
              depth={0.08}
              position={{ x: 0, y: 0, z: 0 }}
              {...childEntityProps}
              animation={childAnimation}
            />
          </Entity>
        </SceneGraph>
      </Reality>
      <EntityPropsPanel entityProps={entityProps} />
      <EntityPropsPanel entityProps={childEntityProps} />
      <Log lines={logger.lines} />
    </div>
  )
}

export default function EntityAnimationIsolationCleanupPage() {
  const [showA, setShowA] = useState(true)
  const [showB, setShowB] = useState(true)

  return (
    <EntityAnimationPageShell
      title="Isolation and Cleanup"
      description="Run two independent Entity animations, stop or destroy either one, and verify the other keeps its controller and callbacks."
    >
      <div className="mb-4 flex gap-2">
        <button className={btnCls} onClick={() => setShowA(value => !value)}>
          {showA ? 'Destroy A' : 'Remount A'}
        </button>
        <button className={btnCls} onClick={() => setShowB(value => !value)}>
          {showB ? 'Destroy B' : 'Remount B'}
        </button>
      </div>
      <div
        data-testid="entity-motion-isolation-result"
        className="mb-4 font-mono text-xs"
      >
        {showA ? 'A mounted' : 'A destroyed'};{' '}
        {showB ? 'B mounted' : 'B destroyed'}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {showA && <IsolatedEntity name="A" y={-0.08} />}
        {showB && <IsolatedEntity name="B" y={0.08} />}
      </div>
    </EntityAnimationPageShell>
  )
}
