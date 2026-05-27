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
