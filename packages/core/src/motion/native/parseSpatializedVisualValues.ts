import type { SpatializedVisualValues } from '../../types/motion/spatializedVisual'

/**
 * Parses native wire payload `{ values }` (or legacy flat shape) into visual values.
 *
 * @param data Raw payload returned from the native bridge.
 * @returns Parsed visual values in SDK shape.
 */
export function parseSpatializedVisualValues(
  data: unknown,
): SpatializedVisualValues {
  const raw =
    (data as { values?: unknown })?.values ??
    data ??
    ({} as Record<string, unknown>)
  const record = raw as Record<string, unknown>
  const transformRaw = record.transform as Record<string, unknown> | undefined

  /**
   * Reads a partial vec3-like payload from native bridge data.
   *
   * @param group Candidate vec3 payload.
   * @returns A partial vec3 when any axis is present.
   */
  const readVec3 = (group: unknown) => {
    if (!group || typeof group !== 'object') return undefined
    const g = group as Record<string, number | undefined>
    const out: { x?: number; y?: number; z?: number } = {}
    if (g.x !== undefined) out.x = g.x
    if (g.y !== undefined) out.y = g.y
    if (g.z !== undefined) out.z = g.z
    return Object.keys(out).length > 0 ? out : undefined
  }

  const values: SpatializedVisualValues = {}
  if (typeof record.opacity === 'number') {
    values.opacity = record.opacity
  }

  if (transformRaw) {
    const transform: NonNullable<SpatializedVisualValues['transform']> = {}
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
