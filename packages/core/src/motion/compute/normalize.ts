import type { SpatializedVisualValues } from '../../types/motion/spatializedVisual'
import type { TimingFunction } from '../../types/animation'
import type {
  NormalizedSpatializedMotionConfig,
  SpatializedMotionConfig,
  SpatializedMotionProperty,
  SpatializedMotionSegmentConfig,
  SpatializedMotionTrack,
  SpatializedMotionTimelineConfig,
} from '../../types/motion/spatializedMotion'

/**
 * Flattens visual values into motion-property/value pairs.
 *
 * @param values Visual values to inspect.
 * @param out Collector for discovered motion property samples.
 */
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

/**
 * Converts `0%`-style timeline keys into [0, 1] ratios.
 *
 * @param key Percentage key from the timeline config.
 * @returns The normalized ratio represented by the key.
 */
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

/**
 * Desugars shorthand from/to motion config into canonical tracks.
 *
 * @param simple Shorthand segment config.
 * @returns Canonical track-based motion config.
 */
export function segmentConfigToMotionConfig(
  simple: SpatializedMotionSegmentConfig,
): NormalizedSpatializedMotionConfig {
  if (!simple.from || !simple.to) {
    throw new Error(
      '[SpatializedMotion] top-level from and to are both required',
    )
  }
  const duration = simple.duration ?? 0.3
  const fromScalars: Array<{
    property: SpatializedMotionProperty
    value: number
  }> = []
  const toScalars: Array<{
    property: SpatializedMotionProperty
    value: number
  }> = []

  collectScalars(simple.from, fromScalars)
  collectScalars(simple.to, toScalars)

  const trackMap = new Map<SpatializedMotionProperty, SpatializedMotionTrack>()
  const properties = new Set([
    ...fromScalars.map(entry => entry.property),
    ...toScalars.map(entry => entry.property),
  ])

  for (const property of properties) {
    const fromEntry = fromScalars.find(f => f.property === property)
    const toEntry = toScalars.find(f => f.property === property)
    if (!fromEntry) {
      throw new Error(
        `[SpatializedMotion] missing start boundary for "${property}"`,
      )
    }
    if (!toEntry) {
      throw new Error(
        `[SpatializedMotion] missing end boundary for "${property}"`,
      )
    }
    trackMap.set(property, {
      property,
      timingFunction: simple.timingFunction,
      keyframes: [
        { at: 0, value: fromEntry.value },
        { at: duration, value: toEntry.value },
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

/**
 * Desugars percentage-key timeline config into canonical tracks.
 *
 * @param config Timeline config using percentage keys.
 * @returns Canonical track-based motion config.
 */
export function desugarTimelineConfig(
  config: SpatializedMotionTimelineConfig,
): NormalizedSpatializedMotionConfig {
  if (Array.isArray(config.timeline) || !config.timeline) {
    throw new Error('[SpatializedMotion] timeline must be an object')
  }

  const entries = Object.entries(config.timeline)
  let hasPercentageKey = false
  const frames = entries
    .map(([key, values]) => {
      if (!values || typeof values !== 'object' || Array.isArray(values)) {
        throw new Error(`[SpatializedMotion] invalid timeline frame "${key}"`)
      }
      if (key === 'from') return { key, atRatio: 0, values }
      if (key === 'to') return { key, atRatio: 1, values }
      hasPercentageKey = true
      return { key, atRatio: parsePercentageKey(key), values }
    })
    .sort((a, b) => a.atRatio - b.atRatio)

  // Dev warn: top-level from/to are ignored once a timeline is present.
  if (config.from !== undefined || config.to !== undefined) {
    console.warn(
      '[SpatializedMotion] top-level from/to are ignored because timeline is present',
    )
  }

  // Start/end boundary frames are required; this change does not fill missing
  // boundaries from underlying element style.
  const hasStartFrame = frames.some(frame => frame.atRatio === 0)
  const hasEndFrame = frames.some(frame => frame.atRatio === 1)
  if (!hasStartFrame) {
    throw new Error(
      '[SpatializedMotion] timeline must define a start frame (from or 0%)',
    )
  }
  if (!hasEndFrame) {
    throw new Error(
      '[SpatializedMotion] timeline must define an end frame (to or 100%)',
    )
  }

  if (hasPercentageKey && config.duration === undefined) {
    throw new Error(
      '[SpatializedMotion] duration is required when timeline uses percentage keys',
    )
  }
  const duration = config.duration ?? 0.3

  const trackMap = new Map<
    SpatializedMotionProperty,
    Array<{
      at: number
      value: number
      timingFunction?: TimingFunction
    }>
  >()
  const fromProperties = new Set<SpatializedMotionProperty>()
  const zeroProperties = new Set<SpatializedMotionProperty>()
  const toProperties = new Set<SpatializedMotionProperty>()
  const hundredProperties = new Set<SpatializedMotionProperty>()

  for (const frame of frames) {
    const at = frame.atRatio * duration
    const scalars: Array<{
      property: SpatializedMotionProperty
      value: number
    }> = []
    collectScalars(frame.values, scalars)
    for (const scalar of scalars) {
      if (frame.key === 'from') fromProperties.add(scalar.property)
      if (frame.key !== 'from' && frame.atRatio === 0) {
        zeroProperties.add(scalar.property)
      }
      if (frame.key === 'to') toProperties.add(scalar.property)
      if (frame.key !== 'to' && frame.atRatio === 1) {
        hundredProperties.add(scalar.property)
      }
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

  const tracks = [...trackMap.entries()].map(([property, keyframes]) => {
    const startCount =
      Number(fromProperties.has(property)) +
      Number(zeroProperties.has(property))
    const endCount =
      Number(toProperties.has(property)) +
      Number(hundredProperties.has(property))
    if (startCount > 1) {
      throw new Error(
        `[SpatializedMotion] duplicate start boundary for "${property}"`,
      )
    }
    if (endCount > 1) {
      throw new Error(
        `[SpatializedMotion] duplicate end boundary for "${property}"`,
      )
    }
    return {
      property,
      timingFunction: config.timingFunction,
      keyframes,
    }
  })

  return {
    duration,
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

/**
 * Normalizes any supported motion config shape into canonical tracks.
 *
 * @param config Motion config in shorthand, timeline, or canonical form.
 * @returns Canonical track-based motion config.
 */
export function normalizeMotionConfig(
  config: SpatializedMotionConfig,
): NormalizedSpatializedMotionConfig {
  if (config.timeline !== undefined) {
    return desugarTimelineConfig(config as SpatializedMotionTimelineConfig)
  }
  return segmentConfigToMotionConfig(config as SpatializedMotionSegmentConfig)
}
