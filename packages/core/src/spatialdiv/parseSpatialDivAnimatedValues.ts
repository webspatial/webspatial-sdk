import type { SpatialDivAnimatedValues } from '../types/spatialDivAnimation'

/** Parse native wire payload `{ values }` (or legacy flat shape) into animated values. */
export function parseSpatialDivAnimatedValues(
  data: unknown,
): SpatialDivAnimatedValues {
  const raw =
    (data as { values?: unknown })?.values ??
    data ??
    ({} as Record<string, unknown>)
  const record = raw as Record<string, unknown>
  const transformRaw = record.transform as Record<string, unknown> | undefined

  const readVec3 = (group: unknown) => {
    if (!group || typeof group !== 'object') return undefined
    const g = group as Record<string, number | undefined>
    const out: { x?: number; y?: number; z?: number } = {}
    if (g.x !== undefined) out.x = g.x
    if (g.y !== undefined) out.y = g.y
    if (g.z !== undefined) out.z = g.z
    return Object.keys(out).length > 0 ? out : undefined
  }

  const values: SpatialDivAnimatedValues = {}
  if (typeof record.opacity === 'number') {
    values.opacity = record.opacity
  }

  if (transformRaw) {
    const transform: NonNullable<SpatialDivAnimatedValues['transform']> = {}
    const translate = readVec3(transformRaw.translate)
    const rotate = readVec3(transformRaw.rotate)
    const scale = readVec3(transformRaw.scale)
    if (translate) transform.translate = translate
    if (rotate) transform.rotate = rotate
    if (scale) transform.scale = scale
    if (Object.keys(transform).length > 0) {
      values.transform = transform
    }
  }

  return values
}
