import type {
  SpatialDivMotionConfig,
  SpatialDivMotionProperty,
  SpatialDivMotionTrack,
} from '@webspatial/core-sdk'

const ALLOWED_PROPERTIES = new Set<SpatialDivMotionProperty>([
  'opacity',
  'transform.translate.x',
  'transform.translate.y',
  'transform.translate.z',
  'transform.rotate.x',
  'transform.rotate.y',
  'transform.rotate.z',
  'transform.scale.x',
  'transform.scale.y',
  'transform.scale.z',
])

const FORBIDDEN_PREFIXES = [
  'width',
  'height',
  'back',
  'backOffset',
  'depth',
] as const

export function validateSpatialDivMotionConfig(
  config: SpatialDivMotionConfig,
): void {
  const { duration, tracks } = config

  if (
    typeof duration !== 'number' ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new Error(
      '[useSpatialDivMotion] duration must be a finite number > 0',
    )
  }

  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error('[useSpatialDivMotion] tracks must be a non-empty array')
  }

  const seen = new Set<string>()
  for (const track of tracks) {
    validateTrack(track, duration, seen)
  }

  if (config.delay !== undefined) {
    const d = config.delay
    if (typeof d !== 'number' || !Number.isFinite(d) || d < 0) {
      throw new Error('[useSpatialDivMotion] delay must be >= 0 and finite')
    }
  }

  if (config.playbackRate !== undefined) {
    const r = config.playbackRate
    if (typeof r !== 'number' || !Number.isFinite(r) || r <= 0) {
      throw new Error(
        '[useSpatialDivMotion] playbackRate must be > 0 and finite',
      )
    }
  }
}

function validateTrack(
  track: SpatialDivMotionTrack,
  duration: number,
  seen: Set<string>,
): void {
  const prop = track.property as string
  for (const forbidden of FORBIDDEN_PREFIXES) {
    if (prop === forbidden || prop.startsWith(`${forbidden}.`)) {
      throw new Error(
        `[useSpatialDivMotion] property "${prop}" is not animatable`,
      )
    }
  }

  if (!ALLOWED_PROPERTIES.has(track.property)) {
    throw new Error(`[useSpatialDivMotion] unknown property "${prop}"`)
  }

  if (seen.has(prop)) {
    throw new Error(`[useSpatialDivMotion] duplicate track for "${prop}"`)
  }
  seen.add(prop)

  const kf = track.keyframes
  if (!Array.isArray(kf) || kf.length < 2) {
    throw new Error(
      `[useSpatialDivMotion] track "${prop}" needs at least 2 keyframes`,
    )
  }

  let prevAt = -Infinity
  for (const frame of kf) {
    if (typeof frame.at !== 'number' || !Number.isFinite(frame.at)) {
      throw new Error(
        `[useSpatialDivMotion] keyframe.at must be finite for "${prop}"`,
      )
    }
    if (frame.at < 0 || frame.at > duration) {
      throw new Error(
        `[useSpatialDivMotion] keyframe.at must be within [0, duration] for "${prop}"`,
      )
    }
    if (frame.at < prevAt) {
      throw new Error(
        `[useSpatialDivMotion] keyframes must be sorted by at for "${prop}"`,
      )
    }
    prevAt = frame.at
    validateScalar(frame.value, track.property)
  }
}

function validateScalar(
  value: number,
  property: SpatialDivMotionProperty,
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`[useSpatialDivMotion] invalid value for ${property}`)
  }
  if (property === 'opacity' && (value < 0 || value > 1)) {
    throw new Error('[useSpatialDivMotion] opacity must be in [0, 1]')
  }
  if (property.startsWith('transform.scale.') && value < 0) {
    throw new Error('[useSpatialDivMotion] scale must be >= 0')
  }
}
