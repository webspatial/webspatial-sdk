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

/** Overlay frozen scalars onto a freshly sampled timeline value. */
export function applyFrozenProperties(
  sampled: SpatializedVisualValues,
  frozen: SpatializedVisualValues,
  properties: Iterable<SpatializedMotionProperty>,
): SpatializedVisualValues {
  const out: SpatializedVisualValues = {
    opacity: sampled.opacity,
    transform: sampled.transform
      ? {
          translate: sampled.transform.translate
            ? { ...sampled.transform.translate }
            : undefined,
          rotate: sampled.transform.rotate
            ? { ...sampled.transform.rotate }
            : undefined,
          scale: sampled.transform.scale
            ? { ...sampled.transform.scale }
            : undefined,
        }
      : undefined,
  }
  for (const property of properties) {
    const v = getScalar(frozen, property)
    if (v !== undefined) setScalar(out, property, v)
  }
  return out
}

export function snapshotScalars(
  values: SpatializedVisualValues,
  properties: Iterable<SpatializedMotionProperty>,
): SpatializedVisualValues {
  const out: SpatializedVisualValues = {}
  for (const property of properties) {
    const v = getScalar(values, property)
    if (v !== undefined) setScalar(out, property, v)
  }
  return out
}
