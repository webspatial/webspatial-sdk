import type { SpatialDivVisualValues } from '../../types/spatialDivVisual'
import type {
  SpatialDivMotionConfig,
  SpatialDivMotionProperty,
  SpatialDivSegmentConfig,
  SpatialDivMotionTrack,
} from '../../types/spatialDivMotion'

function collectScalars(
  values: SpatialDivVisualValues,
  out: Array<{ property: SpatialDivMotionProperty; value: number }>,
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
          property: `transform.${group}.${axis}` as SpatialDivMotionProperty,
          value: v,
        })
      }
    }
  }
}

/** Desugar simple from/to config into a timeline config. */
export function segmentConfigToMotionConfig(
  simple: SpatialDivSegmentConfig,
): SpatialDivMotionConfig {
  const duration = simple.duration ?? 0.3
  const fromScalars: Array<{
    property: SpatialDivMotionProperty
    value: number
  }> = []
  const toScalars: Array<{
    property: SpatialDivMotionProperty
    value: number
  }> = []

  if (simple.from) collectScalars(simple.from, fromScalars)
  collectScalars(simple.to, toScalars)

  const easing = simple.timingFunction ?? 'easeInOut'
  const trackMap = new Map<SpatialDivMotionProperty, SpatialDivMotionTrack>()

  for (const { property, value } of toScalars) {
    const fromEntry = fromScalars.find(f => f.property === property)
    const fromValue = fromEntry?.value ?? value
    trackMap.set(property, {
      property,
      easing,
      keyframes: [
        { at: 0, value: fromValue },
        { at: duration, value },
      ],
    })
  }

  const tracks = [...trackMap.values()]
  if (tracks.length === 0) {
    throw new Error(
      '[SpatialDivMotion.simple] to must include at least one animatable field',
    )
  }

  return {
    duration,
    tracks,
    delay: simple.delay,
    autoStart: simple.autoStart,
    loop: simple.loop,
    playbackRate: simple.playbackRate,
    onStart: simple.onStart,
    onComplete: simple.onComplete,
    onCancel: simple.onCancel,
    onError: simple.onError,
  }
}
