import { SpatialEntity } from '@webspatial/core-sdk'
import type { AnimatedProps, AnimatedPropsInternal } from '@webspatial/core-sdk'
import { useEffect, useRef } from 'react'
import { EntityProps } from '../type'
import { shallowEqualRotation, shallowEqualVec3 } from '../utils'

interface TransformWithAnimation {
  position?: EntityProps['position']
  rotation?: EntityProps['rotation']
  scale?: EntityProps['scale']
  animation?: AnimatedProps
}

export function useEntityTransform(
  entity: SpatialEntity | null,
  { position, rotation, scale, animation }: TransformWithAnimation,
) {
  const last = useRef<{ position?: any; rotation?: any; scale?: any }>({})

  useEffect(() => {
    if (!entity) return

    // Determine which fields are suppressed by an alive animation session
    const suppressedFields: Set<string> =
      animation && (animation as AnimatedPropsInternal).__getSuppressedFields
        ? new Set(
            (animation as AnimatedPropsInternal).__getSuppressedFields() ?? [],
          )
        : new Set()

    // Determine which unsuppressed fields have changed
    const positionChanged =
      !suppressedFields.has('position') &&
      !shallowEqualVec3(last.current.position, position)
    const rotationChanged =
      !suppressedFields.has('rotation') &&
      !shallowEqualRotation(last.current.rotation, rotation)
    const scaleChanged =
      !suppressedFields.has('scale') &&
      !shallowEqualVec3(last.current.scale, scale)

    // Always cache latest prop values (even for suppressed fields)
    // so we have them when suppression is released
    last.current = { position, rotation, scale }

    const shouldUpdate = positionChanged || rotationChanged || scaleChanged

    if (!shouldUpdate) return

    // Build update with only the changed, non-suppressed fields
    const update: Record<string, any> = {}
    if (positionChanged && position) update.position = position
    if (rotationChanged && rotation) update.rotation = rotation
    if (scaleChanged && scale) update.scale = scale

    if (Object.keys(update).length === 0) return

    const updateTransform = async () => {
      try {
        await entity.updateTransform(update)
      } catch (err) {
        console.error('[useEntityTransform] Failed to update transform:', err)
      }
    }

    updateTransform()

    return () => {}
  }, [entity, position, rotation, scale, animation])
}
