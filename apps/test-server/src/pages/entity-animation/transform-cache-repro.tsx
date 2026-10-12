import { useRef, useState } from 'react'
import { BoxEntity, Reality, SceneGraph } from '@webspatial/react-sdk'
import type { EntityRefShape } from '@webspatial/react-sdk'
import { useEntityAnimation } from '@webspatial/react-sdk/experimental'
import {
  EntityAnimationPageShell,
  fmtVec3,
  btnCls,
  btnPrimary,
  useLog,
} from './shared'

type ReproPhase =
  | 'idle'
  | 'playing'
  | 'completed'
  | 'applying-position'
  | 'position-updated'
  | 'error'

const initialPosition = { x: -0.18, y: 0, z: 0 }
const initialRotation = { x: 0, y: 0, z: 0 }
const initialScale = { x: 1, y: 1, z: 1 }
const terminalPosition = { x: 0.18, y: 0, z: 0 }
const terminalRotation = { x: 0, y: 60, z: 0 }
const terminalScale = { x: 2, y: 2, z: 2 }

/** Returns a stable JSON representation for the AVP DOM probes. */
function serialize(value: unknown): string {
  return JSON.stringify(value)
}

/** Reads the command-side transform shadow state from the Core Entity. */
function readShadowState(entityRef: React.RefObject<EntityRefShape | null>) {
  const entity = entityRef.current?.entity
  return {
    position: entity?.position,
    rotation: entity?.rotation,
    scale: entity?.scale,
  }
}

/** Compares a vector with the expected animation terminal value. */
function isNearVec3(
  actual: { x: number; y: number; z: number } | undefined,
  expected: { x: number; y: number; z: number },
  tolerance = 0.01,
): boolean {
  return Boolean(
    actual &&
      Math.abs(actual.x - expected.x) <= tolerance &&
      Math.abs(actual.y - expected.y) <= tolerance &&
      Math.abs(actual.z - expected.z) <= tolerance,
  )
}

/** Provides an AVP repro for stale Core transform values after native motion. */
export default function EntityAnimationTransformCacheReproPage() {
  const logger = useLog()
  const entityRef = useRef<EntityRefShape>(null)
  const [phase, setPhase] = useState<ReproPhase>('idle')

  const [animation, api, entityProps] = useEntityAnimation({
    from: {
      position: initialPosition,
      rotation: initialRotation,
      scale: initialScale,
    },
    to: {
      position: terminalPosition,
      rotation: terminalRotation,
      scale: terminalScale,
    },
    duration: 1.5,
    timingFunction: 'easeInOut',
    autoStart: false,
    onStart: () => {
      setPhase('playing')
      logger.log('onStart: native animation started')
    },
    onComplete: values => {
      setPhase('completed')
      logger.log(
        `onComplete: entityProps rotation=${fmtVec3(values.rotation)} scale=${fmtVec3(values.scale)}`,
      )
    },
    onError: error => {
      setPhase('error')
      logger.log(`onError [${error.code}] ${error.reason}`)
    },
  })

  // Re-read the mutable Core Entity after every lifecycle or imperative-write render.
  const shadowState = readShadowState(entityRef)
  const hasTerminalConfirmation = Boolean(
    isNearVec3(entityProps.rotation, terminalRotation) &&
      isNearVec3(entityProps.scale, terminalScale),
  )
  const shadowIsStale = Boolean(
    hasTerminalConfirmation &&
      !isNearVec3(shadowState.rotation, terminalRotation) &&
      !isNearVec3(shadowState.scale, terminalScale),
  )
  const acceptanceStatus =
    phase === 'position-updated'
      ? shadowIsStale
        ? 'BUG_REPRODUCED'
        : 'NOT_REPRODUCED'
      : phase === 'completed'
        ? shadowIsStale
          ? 'READY_TO_REPRODUCE'
          : 'SHADOW_SYNCED'
        : phase === 'error'
          ? 'ERROR'
          : 'PENDING'

  /** Applies only a position update through the underlying Core Entity. */
  const applyPartialPosition = async () => {
    const entity = entityRef.current?.entity
    if (!entity) {
      setPhase('error')
      logger.log('setPosition skipped: Entity is not ready')
      return
    }

    setPhase('applying-position')
    logger.log('SpatialEntity.setPosition({ x: 0.3, y: 0, z: 0 })')
    try {
      await entity.setPosition({ x: 0.3, y: 0, z: 0 })
      setPhase('position-updated')
    } catch (error) {
      setPhase('error')
      logger.log(
        `setPosition failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return (
    <EntityAnimationPageShell
      title="Entity Motion Transform Cache Repro"
      description="Play a native rotation and scale animation without spreading entityProps, then issue a position-only Core update. The probes expose whether stale JS SRT shadow values overwrite the animation terminal pose."
    >
      <section className="rounded-2xl border border-gray-800 bg-[#111] p-6">
        <div
          enable-xr
          data-name="Entity Motion Transform Cache Repro Controls"
          data-testid="entity-motion-transform-cache-controls"
          data-webspatial-phase={phase}
          data-webspatial-play-state={api.playState}
          data-webspatial-entity-props={serialize(entityProps)}
          data-webspatial-shadow-state={serialize(shadowState)}
          data-webspatial-acceptance={acceptanceStatus}
        >
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="entity-motion-transform-cache-play"
              className={btnPrimary}
              onClick={() => {
                setPhase('playing')
                api.play()
                logger.log('play()')
              }}
            >
              Play animation
            </button>
            <button
              data-testid="entity-motion-transform-cache-set-position"
              className={btnCls}
              disabled={phase !== 'completed'}
              onClick={() => void applyPartialPosition()}
            >
              setPosition only
            </button>
          </div>

          <div
            data-testid="entity-motion-transform-cache-probe"
            data-webspatial-phase={phase}
            data-webspatial-play-state={api.playState}
            data-webspatial-entity-props={serialize(entityProps)}
            data-webspatial-shadow-state={serialize(shadowState)}
            data-webspatial-acceptance={acceptanceStatus}
            className="mt-4 grid gap-2 rounded-xl border border-gray-800 bg-black/30 p-4 text-xs text-gray-400"
          >
            <div>phase={phase}</div>
            <div>playState={api.playState}</div>
            <div>entityProps={serialize(entityProps)}</div>
            <div>SpatialEntity shadow={serialize(shadowState)}</div>
            <div>acceptance={acceptanceStatus}</div>
          </div>
          <button className={`${btnCls} mt-3`} onClick={logger.clear}>
            Clear log
          </button>
          <div
            data-testid="entity-motion-transform-cache-log"
            className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-black/40 border border-gray-800 p-3 text-xs font-mono text-gray-400"
          >
            {logger.lines.length === 0 && (
              <span className="text-gray-600">No events yet</span>
            )}
            {logger.lines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>

        <Reality
          data-name="Entity Motion Transform Cache Repro Reality"
          data-testid="entity-motion-transform-cache-reality"
          style={{ width: '100%', height: '260px' }}
        >
          <SceneGraph>
            <BoxEntity
              ref={entityRef}
              width={0.26}
              height={0.08}
              depth={0.05}
              position={initialPosition}
              rotation={initialRotation}
              scale={initialScale}
              // Intentionally omit entityProps to keep React from refreshing the Core shadow state.
              animation={animation}
            />
          </SceneGraph>
        </Reality>

        <div className="mt-3 text-xs text-gray-500">
          Expected terminal entityProps: rotation={fmtVec3(terminalRotation)},
          scale={fmtVec3(terminalScale)}. A stale shadow reports
          READY_TO_REPRODUCE before the position-only write and BUG_REPRODUCED
          after it.
        </div>
      </section>
    </EntityAnimationPageShell>
  )
}
