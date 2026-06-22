import { Vec3 } from './types/types'
import type { TransformValues } from './types/animation'

function parseBorderRadius(borderProperty: string, width: number) {
  if (borderProperty === '') {
    return 0
  }
  if (borderProperty.endsWith('%')) {
    return (width * parseFloat(borderProperty)) / 100
  }
  return parseFloat(borderProperty)
}

export function parseCornerRadius(computedStyle: CSSStyleDeclaration) {
  const width = parseFloat(computedStyle.getPropertyValue('width'))

  const topLeftPropertyValue = computedStyle.getPropertyValue(
    'border-top-left-radius',
  )
  const topRightPropertyValue = computedStyle.getPropertyValue(
    'border-top-right-radius',
  )
  const bottomLeftPropertyValue = computedStyle.getPropertyValue(
    'border-bottom-left-radius',
  )
  const bottomRightPropertyValue = computedStyle.getPropertyValue(
    'border-bottom-right-radius',
  )

  const cornerRadius = {
    topLeading: parseBorderRadius(topLeftPropertyValue, width),
    bottomLeading: parseBorderRadius(bottomLeftPropertyValue, width),
    topTrailing: parseBorderRadius(topRightPropertyValue, width),
    bottomTrailing: parseBorderRadius(bottomRightPropertyValue, width),
  }

  return cornerRadius
}

/**
 *
 * compose SRT matrix
 * @export
 * @param {Vec3} position meter
 * @param {Vec3} rotation degree
 * @param {Vec3} scale
 * @return {*}  {DOMMatrix}
 */
export function composeSRT(position: Vec3, rotation: Vec3, scale: Vec3) {
  const { x: px, y: py, z: pz } = position
  const { x: rx, y: ry, z: rz } = rotation
  const { x: sx, y: sy, z: sz } = scale

  let m = new DOMMatrix()
  // https://drafts.fxtf.org/geometry/#immutable-transformation-methods
  // as these methods are post-multiplication, the order of transformations is reversed
  // we want SRT = T * R * S
  m = m.translate(px, py, pz)
  m = m.rotate(rx, ry, rz)
  m = m.scale(sx, sy, sz)
  return m
}

/**
 * Convert a Vec3 to a [x, y, z] tuple for the native JSB wire format.
 * Returns undefined when the input is undefined.
 */
export function toVec3Tuple(v?: Vec3): [number, number, number] | undefined {
  if (v === undefined) return undefined
  return [v.x, v.y, v.z]
}

/**
 * Deep-clone a plain JSON-serializable object by value.
 *
 * Notes:
 * - Only use for data composed of primitives, arrays, and plain objects.
 * - Functions, Dates, Maps/Sets, DOM nodes, and circular structures are not supported.
 */
export function deepCloneJSON<T>(value: T): T {
  const sc = (globalThis as any).structuredClone as
    | ((v: any) => any)
    | undefined
  if (typeof sc === 'function') {
    try {
      return sc(value)
    } catch {
      // fall through to JSON method
    }
  }
  return JSON.parse(JSON.stringify(value))
}

/**
 * Decompose a column-major 4x4 matrix (16 numbers) back into
 * position, rotation (Euler degrees), and scale Vec3 values.
 *
 * This is the inverse of `composeSRT`. It extracts:
 * - Translation from the last column
 * - Scale from the lengths of the first three column vectors
 * - Rotation from the normalised upper-3x3 → Euler XYZ in degrees
 */
export function decomposeSRT(m: number[]): TransformValues {
  // Translation
  const position: Vec3 = { x: m[12], y: m[13], z: m[14] }

  // Scale — column vector lengths
  const sx = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2])
  const sy = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6])
  const sz = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10])
  const scale: Vec3 = { x: sx, y: sy, z: sz }

  // Normalise columns to get rotation matrix
  const r00 = sx !== 0 ? m[0] / sx : 0
  const r10 = sx !== 0 ? m[1] / sx : 0
  const r20 = sx !== 0 ? m[2] / sx : 0
  const r11 = sy !== 0 ? m[5] / sy : 0
  const r21 = sy !== 0 ? m[6] / sy : 0
  const r12 = sz !== 0 ? m[9] / sz : 0
  const r22 = sz !== 0 ? m[10] / sz : 0

  // DOMMatrix.rotate(rx, ry, rz) uses ZYX intrinsic order which maps to
  // extrinsic XYZ. The decomposition below extracts Euler angles that
  // match this convention.
  const RAD2DEG = 180 / Math.PI
  let rx: number, ry: number, rz: number

  // clamp to avoid NaN from asin
  const sinY = -r20
  const clampedSinY = Math.max(-1, Math.min(1, sinY))
  ry = Math.asin(clampedSinY) * RAD2DEG

  if (Math.abs(sinY) < 0.9999999) {
    rx = Math.atan2(r21, r22) * RAD2DEG
    rz = Math.atan2(r10, r00) * RAD2DEG
  } else {
    // Gimbal lock
    rx = Math.atan2(-r12, r11) * RAD2DEG
    rz = 0
  }

  const rotation: Vec3 = { x: rx, y: ry, z: rz }

  return { position, rotation, scale }
}
