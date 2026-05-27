import type { SpatializedMotionConfig } from '../../types/spatializedMotion'

/** Portal suppression for native / Web motion (matches Plan A transform-wide rule). */
export function getMotionSuppressedFields(
  config: SpatializedMotionConfig,
): Set<string> {
  const fields = new Set<string>()
  for (const track of config.tracks) {
    if (track.property === 'opacity') fields.add('opacity')
    if (track.property.startsWith('transform.')) fields.add('transform')
  }
  return fields
}
