import type {
  SpatialDivAnimationConfig,
  SpatialDivAnimatedValues,
} from '@webspatial/core-sdk'

const VALID_TIMING_FUNCTIONS = ['linear', 'easeIn', 'easeOut', 'easeInOut']

const VALID_TOP_KEYS: (keyof SpatialDivAnimatedValues)[] = [
  'back',
  'transform',
  'opacity',
  'depth',
  'width',
  'height',
]

const ENTITY_KEYS = ['position', 'rotation', 'scale']

function validateValues(values: SpatialDivAnimatedValues, label: string) {
  const keys = Object.keys(values)

  // Check for entity keys (mutual exclusion)
  const entityKeys = keys.filter(k => ENTITY_KEYS.includes(k))
  if (entityKeys.length > 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label} contains entity animation keys [${entityKeys.join(', ')}]. ` +
        `Entity and SpatialDiv animation keys are mutually exclusive.`,
    )
  }

  // Check for invalid keys
  const invalidKeys = keys.filter(
    k => !VALID_TOP_KEYS.includes(k as keyof SpatialDivAnimatedValues),
  )
  if (invalidKeys.length > 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label} contains invalid keys: [${invalidKeys.join(', ')}]. ` +
        `Allowed: ${VALID_TOP_KEYS.join(', ')}.`,
    )
  }

  // Validate opacity range
  if (
    values.opacity !== undefined &&
    (values.opacity < 0 || values.opacity > 1)
  ) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.opacity must be in [0, 1], got ${values.opacity}.`,
    )
  }

  // Validate non-negative for width/height
  if (values.width !== undefined && values.width < 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.width must be >= 0, got ${values.width}.`,
    )
  }
  if (values.height !== undefined && values.height < 0) {
    throw new Error(
      `[useSpatialDivAnimation] ${label}.height must be >= 0, got ${values.height}.`,
    )
  }
}

export function validateSpatialDivAnimationConfig(
  config: SpatialDivAnimationConfig,
) {
  if (!config.to || Object.keys(config.to).length === 0) {
    throw new Error(
      '[useSpatialDivAnimation] config.to is required and must have at least one field.',
    )
  }

  validateValues(config.to, 'config.to')
  if (config.from) {
    validateValues(config.from, 'config.from')
  }

  // Validate timingFunction
  if (
    config.timingFunction &&
    !VALID_TIMING_FUNCTIONS.includes(config.timingFunction)
  ) {
    throw new Error(
      `[useSpatialDivAnimation] Invalid timingFunction "${config.timingFunction}". ` +
        `Allowed: ${VALID_TIMING_FUNCTIONS.join(', ')}.`,
    )
  }

  // Validate playbackRate
  if (config.playbackRate !== undefined) {
    if (config.playbackRate === 0 || !isFinite(config.playbackRate)) {
      throw new Error(
        `[useSpatialDivAnimation] playbackRate must be non-zero and finite, got ${config.playbackRate}.`,
      )
    }
  }

  // Validate loop
  if (
    config.loop !== undefined &&
    config.loop !== true &&
    config.loop !== false
  ) {
    if (typeof config.loop === 'object' && config.loop !== null) {
      // Valid { reverse?: boolean }
    } else {
      throw new Error(
        '[useSpatialDivAnimation] loop must be boolean or { reverse?: boolean }.',
      )
    }
  }

  // Validate duration
  if (
    config.duration !== undefined &&
    (config.duration < 0 || !isFinite(config.duration))
  ) {
    throw new Error(
      `[useSpatialDivAnimation] duration must be non-negative and finite, got ${config.duration}.`,
    )
  }

  // Validate delay
  if (
    config.delay !== undefined &&
    (config.delay < 0 || !isFinite(config.delay))
  ) {
    throw new Error(
      `[useSpatialDivAnimation] delay must be non-negative and finite, got ${config.delay}.`,
    )
  }
}
