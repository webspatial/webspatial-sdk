import type { SpatialDivMotionConfig } from '@webspatial/core-sdk'

/** Portal suppression for native / Web motion (matches Plan A transform-wide rule). */
export function getMotionSuppressedFields(
  config: SpatialDivMotionConfig,
): Set<string> {
  const fields = new Set<string>()
  for (const track of config.tracks) {
    if (track.property === 'opacity') fields.add('opacity')
    if (track.property.startsWith('transform.')) fields.add('transform')
  }
  return fields
}
