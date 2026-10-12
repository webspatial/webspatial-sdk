import type { Quaternion, Vec3 } from '@webspatial/core-sdk'

/** Entity Euler angles use degrees and Rz * Ry * Rx. Parent deltas multiply on the left. */
export function applyParentRotation(start: Vec3, delta: Quaternion): Vec3 {
  const half = Math.PI / 360
  const [sx, sy, sz] = [start.x, start.y, start.z].map(v => Math.sin(v * half))
  const [cx, cy, cz] = [start.x, start.y, start.z].map(v => Math.cos(v * half))
  const base = {
    x: sx * cy * cz - cx * sy * sz,
    y: cx * sy * cz + sx * cy * sz,
    z: cx * cy * sz - sx * sy * cz,
    w: cx * cy * cz + sx * sy * sz,
  }
  const product = [
    delta.w * base.x + delta.x * base.w + delta.y * base.z - delta.z * base.y,
    delta.w * base.y - delta.x * base.z + delta.y * base.w + delta.z * base.x,
    delta.w * base.z + delta.x * base.y - delta.y * base.x + delta.z * base.w,
    delta.w * base.w - delta.x * base.x - delta.y * base.y - delta.z * base.z,
  ]
  const length = Math.hypot(...product)
  const [x, y, z, w] = product.map(v => v / length)
  const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (w * y - z * x))))
  const atPole = Math.abs(Math.cos(pitch)) < 1e-7
  const roll = atPole
    ? 0
    : Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))
  const yaw = atPole
    ? Math.atan2(2 * (w * z - x * y), 1 - 2 * (x * x + z * z))
    : Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
  const degrees = 180 / Math.PI
  return { x: roll * degrees, y: pitch * degrees, z: yaw * degrees }
}
