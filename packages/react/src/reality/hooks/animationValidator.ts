import type { AnimationConfig } from '@webspatial/core-sdk'
import { VALID_TIMING_FUNCTIONS } from '@webspatial/core-sdk'
import type { Vec3 } from '@webspatial/core-sdk'

/**
 * Validate an AnimationConfig at call time.
 * Throws on programmer errors so they surface immediately.
 */
export function validateAnimationConfig(config: AnimationConfig): void {
  // to is required and must have at least one transform field
  if (!config.to) {
    throw new Error('[useAnimation] config.to is required')
  }
  const hasTo =
    config.to.position !== undefined ||
    config.to.rotation !== undefined ||
    config.to.scale !== undefined
  if (!hasTo) {
    throw new Error(
      '[useAnimation] config.to must specify at least one of position, rotation, or scale',
    )
  }

  // duration
  if (config.duration !== undefined) {
    if (
      typeof config.duration !== 'number' ||
      !isFinite(config.duration) ||
      config.duration <= 0
    ) {
      throw new Error(
        '[useAnimation] config.duration must be a positive finite number',
      )
    }
  }

  // delay
  if (config.delay !== undefined) {
    if (
      typeof config.delay !== 'number' ||
      !isFinite(config.delay) ||
      config.delay < 0
    ) {
      throw new Error(
        '[useAnimation] config.delay must be a non-negative finite number',
      )
    }
  }

  // timingFunction
  if (config.timingFunction !== undefined) {
    if (
      !(VALID_TIMING_FUNCTIONS as readonly string[]).includes(
        config.timingFunction,
      )
    ) {
      throw new Error(
        `[useAnimation] config.timingFunction must be one of: ${VALID_TIMING_FUNCTIONS.join(', ')}`,
      )
    }
  }

  // loop
  if (config.loop !== undefined && config.loop !== false) {
    if (config.loop === true) {
      // ok
    } else if (typeof config.loop === 'object' && config.loop !== null) {
      const keys = Object.keys(config.loop)
      for (const k of keys) {
        if (k !== 'reverse') {
          throw new Error(
            `[useAnimation] config.loop object contains unknown key "${k}"`,
          )
        }
      }
      if (
        (config.loop as { reverse?: boolean }).reverse !== undefined &&
        typeof (config.loop as { reverse?: boolean }).reverse !== 'boolean'
      ) {
        throw new Error('[useAnimation] config.loop.reverse must be a boolean')
      }
    } else {
      throw new Error(
        '[useAnimation] config.loop must be true, false, undefined, or { reverse?: boolean }',
      )
    }
  }

  // Validate transform values
  if (config.to.position) validateVec3(config.to.position, 'to.position')
  if (config.to.rotation) validateVec3(config.to.rotation, 'to.rotation')
  if (config.to.scale) validateScaleVec3(config.to.scale, 'to.scale')

  if (config.from) {
    if (config.from.position)
      validateVec3(config.from.position, 'from.position')
    if (config.from.rotation)
      validateVec3(config.from.rotation, 'from.rotation')
    if (config.from.scale) validateScaleVec3(config.from.scale, 'from.scale')
  }
}

function validateVec3(v: Vec3, label: string): void {
  if (!isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z)) {
    throw new Error(
      `[useAnimation] config.${label} components must be finite numbers`,
    )
  }
}

function validateScaleVec3(v: Vec3, label: string): void {
  validateVec3(v, label)
  if (v.x < 0 || v.y < 0 || v.z < 0) {
    throw new Error(
      `[useAnimation] config.${label} components must be non-negative`,
    )
  }
}

/**
 * Extract which transform fields are targeted by the animation config.
 */
export function getAnimatedFields(
  config: AnimationConfig,
): ('position' | 'rotation' | 'scale')[] {
  const fields: ('position' | 'rotation' | 'scale')[] = []
  if (config.to.position !== undefined) fields.push('position')
  if (config.to.rotation !== undefined) fields.push('rotation')
  if (config.to.scale !== undefined) fields.push('scale')
  return fields
}
