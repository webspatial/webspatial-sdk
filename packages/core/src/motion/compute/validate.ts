import { SPATIALIZED_MOTION_PROPERTIES } from '../../types/motion/spatializedMotion'
import type {
  NormalizedSpatializedMotionConfig,
  SpatializedMotionProperty,
  SpatializedMotionConfig,
  SpatializedMotionTrack,
} from '../../types/motion/spatializedMotion'
import { normalizeMotionConfig } from './normalize'
const ALLOWED_PROPERTIES = new Set<SpatializedMotionProperty>(
  SPATIALIZED_MOTION_PROPERTIES,
)

const FORBIDDEN_PREFIXES = [
  'width',
  'height',
  'back',
  'backOffset',
  'depth',
] as const

/**
 * Validates any supported motion config shape before playback or serialization.
 *
 * @param config Motion config in any supported input shape.
 */
export function validateSpatializedMotionConfig(
  config: SpatializedMotionConfig,
): void {
  if ('tracks' in config) {
    throw new Error('[SpatializedMotion] tracks authoring is internal')
  }
  const normalized = normalizeMotionConfig(config)
  validateNormalizedMotionConfig(normalized)
}

/**
 * Validates the canonical track-based motion config form.
 *
 * @param config Canonical motion config to validate.
 */
export function validateNormalizedMotionConfig(
  config: NormalizedSpatializedMotionConfig,
): void {
  const { duration, tracks } = config

  if (
    typeof duration !== 'number' ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new Error('[SpatializedMotion] duration must be a finite number > 0')
  }

  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error('[SpatializedMotion] tracks must be a non-empty array')
  }

  const seen = new Set<string>()
  for (const track of tracks) {
    validateTrack(track, duration, seen)
  }

  if (config.delay !== undefined) {
    const d = config.delay
    if (typeof d !== 'number' || !Number.isFinite(d) || d < 0) {
      throw new Error('[SpatializedMotion] delay must be >= 0 and finite')
    }
  }

  if (config.playbackRate !== undefined) {
    const r = config.playbackRate
    if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) {
      throw new Error('[SpatializedMotion] playbackRate must be > 0 and finite')
    }
  }
}

/**
 * Validates a single track against property and keyframe invariants.
 *
 * @param track Motion track to validate.
 * @param duration Parent motion duration.
 * @param seen Track-property set used to detect duplicates.
 */
function validateTrack(
  track: SpatializedMotionTrack,
  duration: number,
  seen: Set<string>,
): void {
  const prop = track.property as string
  for (const forbidden of FORBIDDEN_PREFIXES) {
    if (prop === forbidden || prop.startsWith(`${forbidden}.`)) {
      throw new Error(
        `[SpatializedMotion] property "${prop}" is not animatable`,
      )
    }
  }

  if (!ALLOWED_PROPERTIES.has(track.property)) {
    throw new Error(`[SpatializedMotion] unknown property "${prop}"`)
  }

  if (seen.has(prop)) {
    throw new Error(`[SpatializedMotion] duplicate track for "${prop}"`)
  }
  seen.add(prop)

  const kf = track.keyframes
  if (!Array.isArray(kf) || kf.length < 2) {
    throw new Error(
      `[SpatializedMotion] track "${prop}" needs at least 2 keyframes`,
    )
  }

  let prevAt = -Infinity
  for (const frame of kf) {
    if (typeof frame.at !== 'number' || !Number.isFinite(frame.at)) {
      throw new Error(
        `[SpatializedMotion] keyframe.at must be finite for "${prop}"`,
      )
    }
    if (frame.at < 0 || frame.at > duration) {
      throw new Error(
        `[SpatializedMotion] keyframe.at must be within [0, duration] for "${prop}"`,
      )
    }
    if (frame.at < prevAt) {
      throw new Error(
        `[SpatializedMotion] keyframes must be sorted by at for "${prop}"`,
      )
    }
    prevAt = frame.at
    validateScalar(frame.value, track.property)
  }
}

/**
 * Validates a numeric sample for a specific motion property.
 *
 * @param value Numeric sample value to validate.
 * @param property Motion property the value belongs to.
 */
function validateScalar(
  value: number,
  property: SpatializedMotionProperty,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`[SpatializedMotion] invalid value for ${property}`)
  }
  if (property === 'opacity' && (value < 0 || value > 1)) {
    throw new Error('[SpatializedMotion] opacity must be in [0, 1]')
  }
  if (property.startsWith('transform.scale.') && value < 0) {
    throw new Error('[SpatializedMotion] scale must be >= 0')
  }
}
