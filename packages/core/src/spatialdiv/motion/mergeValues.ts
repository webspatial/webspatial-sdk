import type { SpatialDivVisualValues } from '../../types/spatialDivVisual'
import type { SpatialDivMotionProperty } from '../../types/spatialDivMotion'

function setScalar(
  values: SpatialDivVisualValues,
  property: SpatialDivMotionProperty,
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

function getScalar(
  values: SpatialDivVisualValues,
  property: SpatialDivMotionProperty,
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
  sampled: SpatialDivVisualValues,
  frozen: SpatialDivVisualValues,
  properties: Iterable<SpatialDivMotionProperty>,
): SpatialDivVisualValues {
  const out: SpatialDivVisualValues = {
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
  values: SpatialDivVisualValues,
  properties: Iterable<SpatialDivMotionProperty>,
): SpatialDivVisualValues {
  const out: SpatialDivVisualValues = {}
  for (const property of properties) {
    const v = getScalar(values, property)
    if (v !== undefined) setScalar(out, property, v)
  }
  return out
}
