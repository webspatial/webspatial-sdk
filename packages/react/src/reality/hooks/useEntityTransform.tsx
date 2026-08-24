import { SpatialEntity } from '@webspatial/core-sdk'
import { useEffect, useRef } from 'react'
import { EntityProps } from '../type'
import { shallowEqualRotation, shallowEqualVec3 } from '../utils'

interface EntityTransformProps {
  /** React-declared Entity position. */
  position?: EntityProps['position']
  /** React-declared Entity rotation. */
  rotation?: EntityProps['rotation']
  /** React-declared Entity scale. */
  scale?: EntityProps['scale']
}

/**
 * Synchronizes changed React transform props while Native arbitrates playback writes.
 *
 * @param entity - Current Core Entity target.
 * @param props - React-declared transform values.
 * @param syncRevision - Revision that forces declared values to be submitted again.
 */
export function useEntityTransform(
  entity: SpatialEntity | null,
  { position, rotation, scale }: EntityTransformProps,
  syncRevision = 0,
) {
  const last = useRef<{
    position?: EntityProps['position']
    rotation?: EntityProps['rotation']
    scale?: EntityProps['scale']
  }>({})
  const lastSyncRevision = useRef(syncRevision)

  useEffect(() => {
    if (!entity) return

    const forceSync = lastSyncRevision.current !== syncRevision
    const positionChanged =
      forceSync || !shallowEqualVec3(last.current.position, position)
    const rotationChanged =
      forceSync || !shallowEqualRotation(last.current.rotation, rotation)
    const scaleChanged =
      forceSync || !shallowEqualVec3(last.current.scale, scale)

    last.current = { position, rotation, scale }
    lastSyncRevision.current = syncRevision
    const update: Partial<
      Pick<EntityProps, 'position' | 'rotation' | 'scale'>
    > = {}
    if (positionChanged && position) update.position = position
    if (rotationChanged && rotation) update.rotation = rotation
    if (scaleChanged && scale) update.scale = scale
    if (Object.keys(update).length === 0) return

    void entity.updateTransform(update).catch(error => {
      console.error('[useEntityTransform] Failed to update transform:', error)
    })
  }, [entity, position, rotation, scale, syncRevision])
}
