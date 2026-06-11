import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type { SpatializedMotionProperty } from '../../types/spatializedMotion'

/**
 * Writes a sampled numeric track value into the corresponding
 * SpatializedVisualValues field.
 *
 * @param visualValues Visual value object being populated for the sampled time.
 * @param motionProperty Motion property path for the sampled track.
 * @param sampledValue Numeric value sampled from the track at the current time.
 */
export function setMotionPropertyValue(
  visualValues: SpatializedVisualValues,
  motionProperty: SpatializedMotionProperty,
  sampledValue: number,
): void {
  if (motionProperty === 'opacity') {
    visualValues.opacity = sampledValue
    return
  }

  const [, group, axis] = motionProperty.split('.') as [
    'transform',
    'translate' | 'rotate' | 'scale',
    'x' | 'y' | 'z',
  ]

  const transform = (visualValues.transform ??= {})
  const vector = (transform[group] ??= {})
  vector[axis] = sampledValue
}
