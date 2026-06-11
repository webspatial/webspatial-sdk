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

  // Read animation.__animating on every render so that when the session ends
  // and a re-render occurs, the value change (true → false) triggers the
  // effect to re-run, allowing us to re-sync the React-declared transform.
  const isAnimating = animation ? animation.__animating : false

  useEffect(() => {
    if (!entity) return

    // Determine which fields are suppressed by an alive animation session
    const suppressedFields: Set<string> =
      animation && (animation as AnimatedPropsInternal).__getSuppressedFields
        ? new Set(
            (animation as AnimatedPropsInternal).__getSuppressedFields() ?? [],
          )
        : new Set()

    // Clear cached values for suppressed fields so that when suppression is
    // released (animation ends) the next effect run will detect a difference
    // between the cached value (now undefined) and the current prop, forcing
    // a re-sync back to the React-declared transform.
    if (suppressedFields.has('position')) last.current.position = undefined
    if (suppressedFields.has('rotation')) last.current.rotation = undefined
    if (suppressedFields.has('scale')) last.current.scale = undefined

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

    // Cache latest prop values only for non-suppressed fields.
    // Suppressed fields keep their cleared state (undefined) so re-sync
    // is triggered once suppression lifts.
    if (!suppressedFields.has('position')) last.current.position = position
    if (!suppressedFields.has('rotation')) last.current.rotation = rotation
    if (!suppressedFields.has('scale')) last.current.scale = scale

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
  }, [entity, position, rotation, scale, animation, isAnimating])
}
