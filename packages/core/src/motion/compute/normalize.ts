import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import type { TimingFunction } from '../../types/animation'
import type {
  SpatializedMotionConfig,
  SpatializedMotionProperty,
  SpatializedMotionTimelineConfig,
  SpatializedMotionSegmentConfig,
  SpatializedMotionTrack,
} from '../../types/spatializedMotion'

function collectScalars(
  values: SpatializedVisualValues,
  out: Array<{ property: SpatializedMotionProperty; value: number }>,
): void {
  if (values.opacity !== undefined) {
    out.push({ property: 'opacity', value: values.opacity })
  }
  const tr = values.transform
  if (!tr) return
  for (const group of ['translate', 'rotate', 'scale'] as const) {
    const part = tr[group]
    if (!part) continue
    for (const axis of ['x', 'y', 'z'] as const) {
      const v = part[axis]
      if (v !== undefined) {
        out.push({
          property: `transform.${group}.${axis}` as SpatializedMotionProperty,
          value: v,
        })
      }
    }
  }
}

function validateTimelineConfigShape(
  config: SpatializedMotionTimelineConfig,
): void {
  if ('tracks' in config || 'from' in config || 'to' in config) {
    throw new Error(
      '[SpatializedMotion] timeline config is mutually exclusive with tracks/from-to',
    )
  }
}

function parsePercentageKey(key: string): number {
  if (!/^\d+(\.\d+)?%$/.test(key)) {
    throw new Error(`[SpatializedMotion] invalid timeline key "${key}"`)
  }
  const ratio = Number(key.slice(0, -1))
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 100) {
    throw new Error(`[SpatializedMotion] invalid timeline key "${key}"`)
  }
  return ratio / 100
}

/** Desugar simple from/to config into a timeline config. */
export function segmentConfigToMotionConfig(
  simple: SpatializedMotionSegmentConfig,
): SpatializedMotionConfig {
  const duration = simple.duration ?? 0.3
  const fromScalars: Array<{
    property: SpatializedMotionProperty
    value: number
  }> = []
  const toScalars: Array<{
    property: SpatializedMotionProperty
    value: number
  }> = []

  if (simple.from) collectScalars(simple.from, fromScalars)
  collectScalars(simple.to, toScalars)

  const trackMap = new Map<SpatializedMotionProperty, SpatializedMotionTrack>()

  for (const { property, value } of toScalars) {
    const fromEntry = fromScalars.find(f => f.property === property)
    const fromValue = fromEntry?.value ?? value
    trackMap.set(property, {
      property,
      timingFunction: simple.timingFunction,
      keyframes: [
        { at: 0, value: fromValue },
        { at: duration, value },
      ],
    })
  }

  const tracks = [...trackMap.values()]
  if (tracks.length === 0) {
    throw new Error(
      '[SpatializedMotion.simple] to must include at least one animatable field',
    )
  }

  return {
    duration,
    tracks,
    timingFunction: simple.timingFunction,
    delay: simple.delay,
    autoStart: simple.autoStart,
    loop: simple.loop,
    playbackRate: simple.playbackRate,
    onStart: simple.onStart,
    onComplete: simple.onComplete,
    onStop: simple.onStop,
    onReset: simple.onReset,
    onError: simple.onError,
  }
}

/** Desugar percentage-key timeline config into canonical tracks. */
export function desugarTimelineConfig(
  config: SpatializedMotionTimelineConfig,
): SpatializedMotionConfig {
  validateTimelineConfigShape(config)

  const entries = Object.entries(config.timeline)
  if (entries.length < 2) {
    throw new Error(
      '[SpatializedMotion] timeline must contain at least 2 percentage keys',
    )
  }

  const frames = entries
    .map(([key, values]) => ({
      atRatio: parsePercentageKey(key),
      values,
    }))
    .sort((a, b) => a.atRatio - b.atRatio)

  const trackMap = new Map<
    SpatializedMotionProperty,
    Array<{
      at: number
      value: number
      timingFunction?: TimingFunction
    }>
  >()

  for (const frame of frames) {
    const at = frame.atRatio * config.duration
    const scalars: Array<{
      property: SpatializedMotionProperty
      value: number
    }> = []
    collectScalars(frame.values, scalars)
    for (const scalar of scalars) {
      const keyframes = trackMap.get(scalar.property) ?? []
      const keyframe = {
        at,
        value: scalar.value,
        ...(frame.values.timingFunction !== undefined
          ? { timingFunction: frame.values.timingFunction }
          : {}),
      }
      keyframes.push(keyframe)
      trackMap.set(scalar.property, keyframes)
    }
  }

  const tracks = [...trackMap.entries()].map(([property, keyframes]) => ({
    property,
    timingFunction: config.timingFunction,
    keyframes,
  }))

  return {
    duration: config.duration,
    tracks,
    timingFunction: config.timingFunction,
    delay: config.delay,
    autoStart: config.autoStart,
    loop: config.loop,
    playbackRate: config.playbackRate,
    onStart: config.onStart,
    onComplete: config.onComplete,
    onStop: config.onStop,
    onReset: config.onReset,
    onError: config.onError,
  }
}

export function normalizeMotionConfig(
  config:
    | SpatializedMotionSegmentConfig
    | SpatializedMotionConfig
    | SpatializedMotionTimelineConfig,
): SpatializedMotionConfig {
  if ('timeline' in config) {
    return desugarTimelineConfig(config)
  }
  if ('tracks' in config) {
    return config
  }
  return segmentConfigToMotionConfig(config)
}
