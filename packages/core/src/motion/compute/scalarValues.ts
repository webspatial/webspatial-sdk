import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type { SpatializedMotionProperty } from '../../types/spatializedMotion'

export function setScalar(
  values: SpatializedVisualValues,
  property: SpatializedMotionProperty,
  value: number,
): void {
  if (property === 'opacity') {
    values.opacity = value
    return
  }
  if (!values.transform) values.transform = {}
  const [, group, axis] = property.split('.') as [
    string,
    'translate' | 'rotate' | 'scale',
    'x' | 'y' | 'z',
  ]
  if (!values.transform[group]) {
    values.transform[group] = {}
  }
  ;(values.transform[group] as Record<string, number>)[axis] = value
}

export function getScalar(
  values: SpatializedVisualValues,
  property: SpatializedMotionProperty,
): number | undefined {
  if (property === 'opacity') return values.opacity
  const [, group, axis] = property.split('.') as [
    string,
    'translate' | 'rotate' | 'scale',
    'x' | 'y' | 'z',
  ]
  return values.transform?.[group]?.[axis]
}
