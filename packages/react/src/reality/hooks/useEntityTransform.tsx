import { SpatialEntity } from '@webspatial/core-sdk'
import { useEffect, useRef } from 'react'
import { EntityProps } from '../type'
import { shallowEqualRotation, shallowEqualVec3 } from '../utils'

export function useEntityTransform(
  entity: SpatialEntity | null,
  { position, rotation, scale }: EntityProps,
) {
  const last = useRef<{ position?: any; rotation?: any; scale?: any }>({})

  useEffect(() => {
    if (!entity) return

    const shouldUpdate =
      !shallowEqualVec3(last.current.position, position) ||
      !shallowEqualRotation(last.current.rotation, rotation) ||
      !shallowEqualVec3(last.current.scale, scale)

    if (!shouldUpdate) return

    last.current = { position, rotation, scale }

    const updateTransform = async () => {
      try {
        await entity.updateTransform({ position, rotation, scale })
      } catch (err) {
        console.error('[useEntityTransform] Failed to update transform:', err)
      }
    }

    updateTransform()

    return () => {}
  }, [entity, position, rotation, scale])
}
