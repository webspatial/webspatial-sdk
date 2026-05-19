import type {
  SpatialDivAnimationConfig,
  SpatialDivAnimatedValues,
  SpatialDivTransform,
} from '@webspatial/core-sdk'

const VALID_TIMING_FUNCTIONS = ['linear', 'easeIn', 'easeOut', 'easeInOut']

// Only these top-level keys are allowed in SpatialDivAnimatedValues per spec
const VALID_TOP_KEYS: (keyof SpatialDivAnimatedValues)[] = [
  'transform',
  'opacity',
]

// Layout-affecting fields that MUST throw if present
const LAYOUT_KEYS = ['width', 'height', 'back', 'backOffset', 'depth']

// Entity animation keys — mutually exclusive with SpatialDiv keys
const ENTITY_KEYS = ['position', 'rotation', 'scale']

// Valid sub-keys under transform
const VALID_TRANSFORM_KEYS = ['translate', 'rotate', 'scale']

/**
 * Validate a single xyz object { x?, y?, z? } ensuring all provided values are finite.
 */
function validateXYZ(
  obj: { x?: number; y?: number; z?: number },
  label: string,
): void {
  if (obj.x !== undefined && !isFinite(obj.x)) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.x must be a finite number, got ${obj.x}.`,
    )
  }
  if (obj.y !== undefined && !isFinite(obj.y)) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.y must be a finite number, got ${obj.y}.`,
    )
  }
  if (obj.z !== undefined && !isFinite(obj.z)) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.z must be a finite number, got ${obj.z}.`,
    )
  }
}

/**
 * Validate the transform sub-object.
 * Only translate, rotate, scale sub-keys are allowed.
 */
function validateTransform(
  transform: SpatialDivTransform,
  label: string,
): void {
  const keys = Object.keys(transform)
  const invalidKeys = keys.filter(k => !VALID_TRANSFORM_KEYS.includes(k))
  if (invalidKeys.length > 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.transform contains invalid sub-keys: [${invalidKeys.join(', ')}]. ` +
        `Allowed: ${VALID_TRANSFORM_KEYS.join(', ')}.`,
    )
  }

  if (transform.translate) {
    validateXYZ(transform.translate, `${label}.transform.translate`)
  }
  if (transform.rotate) {
    validateXYZ(transform.rotate, `${label}.transform.rotate`)
  }
  if (transform.scale) {
    validateXYZ(transform.scale, `${label}.transform.scale`)
  }
}

/**
 * Validate a SpatialDivAnimatedValues object (to or from).
 * Enforces the spec whitelist and numeric constraints.
 */
function validateValues(values: SpatialDivAnimatedValues, label: string): void {
  const keys = Object.keys(values)

  // Check for entity keys (mutual exclusion)
  const entityKeys = keys.filter(k => ENTITY_KEYS.includes(k))
  if (entityKeys.length > 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label} contains entity animation keys [${entityKeys.join(', ')}]. ` +
        `Entity and SpatialDiv animation keys are mutually exclusive.`,
    )
  }

  // Check for layout-affecting fields that spec explicitly forbids
  const layoutKeys = keys.filter(k => LAYOUT_KEYS.includes(k))
  if (layoutKeys.length > 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label} contains layout-affecting fields [${layoutKeys.join(', ')}] ` +
        `that affect DOM layout, spatial panel size, depth, or spatial-position semantics. ` +
        `These fields are not animatable.`,
    )
  }

  // Check for any other invalid/unknown keys
  const invalidKeys = keys.filter(
    k => !VALID_TOP_KEYS.includes(k as keyof SpatialDivAnimatedValues),
  )
  if (invalidKeys.length > 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label} contains unsupported fields: [${invalidKeys.join(', ')}]. ` +
        `Only animatable fields are: transform (translate/rotate/scale) and opacity.`,
    )
  }

  // Validate opacity: finite and in [0, 1]
  if (values.opacity !== undefined) {
    if (!isFinite(values.opacity) || values.opacity < 0 || values.opacity > 1) {
      throw new Error(
        `[useSpatialDivAnimation] ${label}.opacity must be a finite number in [0, 1], got ${values.opacity}.`,
      )
    }
  }

  // Validate transform sub-fields
  if (values.transform) {
    validateTransform(values.transform, label)
  }
}

/**
 * Validate the full SpatialDivAnimationConfig.
 * Throws on any violation of the spec requirements.
 */
export function validateSpatialDivAnimationConfig(
  config: SpatialDivAnimationConfig,
): void {
  // config.to is required and must have at least one whitelisted field
  if (!config.to || Object.keys(config.to).length === 0) {
    throw new Error(
      '[useSpatialDivAnimation] config.to is required and must declare at least one animatable field (transform or opacity).',
    )
  }

  // Check that to has at least one meaningful value
  const hasTransform = config.to.transform !== undefined
  const hasOpacity = config.to.opacity !== undefined
  if (!hasTransform && !hasOpacity) {
    throw new Error(
      '[useSpatialDivAnimation] config.to must declare at least one of: transform, opacity.',
    )
  }

  // If transform is present, ensure it has at least one sub-field
  if (hasTransform) {
    const t = config.to.transform!
    if (!t.translate && !t.rotate && !t.scale) {
      throw new Error(
        '[useSpatialDivAnimation] config.to.transform must specify at least one of: translate, rotate, scale.',
      )
    }
  }

  validateValues(config.to, 'config.to')
  if (config.from) {
    validateValues(config.from, 'config.from')
  }

  // Validate duration: must be > 0 and finite (spec: 0 MUST be rejected)
  if (config.duration !== undefined) {
    if (
      typeof config.duration !== 'number' ||
      !isFinite(config.duration) ||
      config.duration <= 0
    ) {
      throw new Error(
        `[useSpatialDivAnimation] config.duration must be a positive finite number (> 0), got ${config.duration}.`,
      )
    }
  }

  // Validate delay: must be >= 0 and finite
  if (config.delay !== undefined) {
    if (
      typeof config.delay !== 'number' ||
      !isFinite(config.delay) ||
      config.delay < 0
    ) {
      throw new Error(
        `[useSpatialDivAnimation] config.delay must be a non-negative finite number, got ${config.delay}.`,
      )
    }
  }

  // Validate timingFunction
  if (
    config.timingFunction !== undefined &&
    !VALID_TIMING_FUNCTIONS.includes(config.timingFunction)
  ) {
    throw new Error(
      `[useSpatialDivAnimation] config.timingFunction must be one of: ${VALID_TIMING_FUNCTIONS.join(', ')}. Got "${config.timingFunction}".`,
    )
  }

  // Validate playbackRate: must be > 0 and finite
  if (config.playbackRate !== undefined) {
    if (
      typeof config.playbackRate !== 'number' ||
      !isFinite(config.playbackRate) ||
      config.playbackRate <= 0
    ) {
      throw new Error(
        `[useSpatialDivAnimation] config.playbackRate must be a positive finite number (> 0), got ${config.playbackRate}.`,
      )
    }
  }

  // Validate loop: must be true, false, undefined, or { reverse?: boolean }
  if (
    config.loop !== undefined &&
    config.loop !== true &&
    config.loop !== false
  ) {
    if (typeof config.loop !== 'object' || config.loop === null) {
      throw new Error(
        '[useSpatialDivAnimation] config.loop must be true, false, undefined, or { reverse?: boolean }.',
      )
    }
    const loopObj = config.loop as Record<string, unknown>
    const loopKeys = Object.keys(loopObj)
    for (const k of loopKeys) {
      if (k !== 'reverse') {
        throw new Error(
          `[useSpatialDivAnimation] config.loop object contains unknown key "${k}". Only "reverse" is allowed.`,
        )
      }
    }
    if (loopObj.reverse !== undefined && typeof loopObj.reverse !== 'boolean') {
      throw new Error(
        '[useSpatialDivAnimation] config.loop.reverse must be a boolean.',
      )
    }
  }
}
