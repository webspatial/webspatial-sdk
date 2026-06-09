import { composeSRT } from '../../utils'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type { SpatializedMotionConfig } from '../../types/spatializedMotion'

/** Suppress `entityTransform` on Model when motion animates root transform. */
export function getStatic3DMotionSuppressedFields(
  config: SpatializedMotionConfig,
): Set<string> {
  const fields = new Set<string>()
  for (const track of config.tracks) {
    if (track.property.startsWith('transform.')) {
      fields.add('entityTransform')
    }
  }
  return fields
}

/** Map motion visual values to a model root matrix (same SRT order as SpatialDiv). */
export function visualValuesToModelMatrix(
  values: SpatializedVisualValues,
): DOMMatrix {
  const t = values.transform
  return composeSRT(
    {
      x: t?.translate?.x ?? 0,
      y: t?.translate?.y ?? 0,
      z: t?.translate?.z ?? 0,
    },
    {
      x: t?.rotate?.x ?? 0,
      y: t?.rotate?.y ?? 0,
      z: t?.rotate?.z ?? 0,
    },
    {
      x: t?.scale?.x ?? 1,
      y: t?.scale?.y ?? 1,
      z: t?.scale?.z ?? 1,
    },
  )
}
