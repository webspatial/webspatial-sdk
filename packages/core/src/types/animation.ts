import type { Vec3 } from './types'

// ---- Timing function ----

export type TimingFunction = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

// ---- Transform values ----

/**
 * Transform values used in animation callbacks.
 * Rotation values are Euler angles in **degrees**, matching the entity
 * `rotation` prop.
 */
export interface TransformValues {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}
