import type { SpatializedVisualValues } from '../../types/motion/spatializedVisual'
import type { SpatializedMotionProperty } from '../../types/motion/spatializedMotion'

function getTranslate(
  visualValues: SpatializedVisualValues,
): NonNullable<NonNullable<SpatializedVisualValues['transform']>['translate']> {
  const transform = (visualValues.transform ??= {})
  return (transform.translate ??= {})
}

function getRotate(
  visualValues: SpatializedVisualValues,
): NonNullable<NonNullable<SpatializedVisualValues['transform']>['rotate']> {
  const transform = (visualValues.transform ??= {})
  return (transform.rotate ??= {})
}

function getScale(
  visualValues: SpatializedVisualValues,
): NonNullable<NonNullable<SpatializedVisualValues['transform']>['scale']> {
  const transform = (visualValues.transform ??= {})
  return (transform.scale ??= {})
}

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
  switch (motionProperty) {
    case 'opacity':
      visualValues.opacity = sampledValue
      return
    case 'transform.translate.x':
      getTranslate(visualValues).x = sampledValue
      return
    case 'transform.translate.y':
      getTranslate(visualValues).y = sampledValue
      return
    case 'transform.translate.z':
      getTranslate(visualValues).z = sampledValue
      return
    case 'transform.rotate.x':
      getRotate(visualValues).x = sampledValue
      return
    case 'transform.rotate.y':
      getRotate(visualValues).y = sampledValue
      return
    case 'transform.rotate.z':
      getRotate(visualValues).z = sampledValue
      return
    case 'transform.scale.x':
      getScale(visualValues).x = sampledValue
      return
    case 'transform.scale.y':
      getScale(visualValues).y = sampledValue
      return
    case 'transform.scale.z':
      getScale(visualValues).z = sampledValue
      return
  }
}
