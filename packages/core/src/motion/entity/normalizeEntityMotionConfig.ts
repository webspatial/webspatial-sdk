import type { TimingFunction } from '../../types/animation'
import {
  ENTITY_MOTION_PROPERTIES,
  type EntityMotionConfig,
  type EntityMotionProperty,
  type EntityMotionTimelinePayload,
  type EntityTransformUpdate,
} from '../../types/motion/entityMotion'

declare const process: { env?: { NODE_ENV?: string } } | undefined

const TIMING_FUNCTIONS = ['linear', 'easeIn', 'easeOut', 'easeInOut'] as const
const AXES = ['x', 'y', 'z'] as const
const COMPONENTS = ['position', 'rotation', 'scale'] as const
const CONFIG_KEYS = new Set([
  'from',
  'to',
  'timeline',
  'duration',
  'timingFunction',
  'delay',
  'playbackRate',
  'loop',
  'autoStart',
  'onStart',
  'onComplete',
  'onStop',
  'onReset',
  'onError',
])

type ScalarFrame = {
  at: number
  values: Map<EntityMotionProperty, number>
  timingFunction?: TimingFunction
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`[useEntityAnimation] ${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function assertFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`[useEntityAnimation] ${label} must be finite`)
  }
  return value
}

function validateTimingFunction(
  value: unknown,
  label: string,
): TimingFunction | undefined {
  if (value === undefined) return undefined
  if (!(TIMING_FUNCTIONS as readonly unknown[]).includes(value)) {
    throw new Error(
      `[useEntityAnimation] ${label} must be linear, easeIn, easeOut, or easeInOut`,
    )
  }
  return value as TimingFunction
}

function collectPatch(
  value: unknown,
  label: string,
  allowTimingFunction: boolean,
): {
  values: Map<EntityMotionProperty, number>
  timingFunction?: TimingFunction
} {
  const patch = assertRecord(value, label)
  const allowedKeys = new Set<string>(COMPONENTS)
  if (allowTimingFunction) allowedKeys.add('timingFunction')
  for (const key of Object.keys(patch)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `[useEntityAnimation] ${label}.${key} is an unsupported property`,
      )
    }
  }

  const values = new Map<EntityMotionProperty, number>()
  for (const component of COMPONENTS) {
    const componentValue = patch[component]
    if (componentValue === undefined) continue
    const axes = assertRecord(componentValue, `${label}.${component}`)
    for (const key of Object.keys(axes)) {
      if (!(AXES as readonly string[]).includes(key)) {
        throw new Error(
          `[useEntityAnimation] ${label}.${component}.${key} is an unsupported axis`,
        )
      }
      const scalar = assertFinite(axes[key], `${label}.${component}.${key}`)
      if (component === 'scale' && scalar < 0) {
        throw new Error(
          `[useEntityAnimation] ${label}.${component}.${key} must be non-negative`,
        )
      }
      values.set(`${component}.${key}` as EntityMotionProperty, scalar)
    }
  }
  if (values.size === 0) {
    throw new Error(
      `[useEntityAnimation] ${label} must contain at least one transform scalar`,
    )
  }

  return {
    values,
    timingFunction: allowTimingFunction
      ? validateTimingFunction(patch.timingFunction, `${label}.timingFunction`)
      : undefined,
  }
}

function validateCommonConfig(config: Record<string, unknown>): {
  duration?: number
  timingFunction: TimingFunction
  delay: number
  playbackRate: number
  loop: boolean | { reverse?: boolean }
} {
  for (const key of Object.keys(config)) {
    if (!CONFIG_KEYS.has(key)) {
      throw new Error(
        `[useEntityAnimation] config.${key} is an unsupported property`,
      )
    }
  }

  const duration =
    config.duration === undefined
      ? undefined
      : assertFinite(config.duration, 'config.duration')
  if (duration !== undefined && duration <= 0) {
    throw new Error('[useEntityAnimation] config.duration must be positive')
  }
  const delay =
    config.delay === undefined ? 0 : assertFinite(config.delay, 'config.delay')
  if (delay < 0) {
    throw new Error('[useEntityAnimation] config.delay must be non-negative')
  }
  const playbackRate =
    config.playbackRate === undefined
      ? 1
      : assertFinite(config.playbackRate, 'config.playbackRate')
  if (playbackRate <= 0) {
    throw new Error('[useEntityAnimation] config.playbackRate must be positive')
  }

  const loopValue = config.loop
  let loop: boolean | { reverse?: boolean } = false
  if (typeof loopValue === 'boolean' || loopValue === undefined) {
    loop = loopValue ?? false
  } else {
    const loopObject = assertRecord(loopValue, 'config.loop')
    for (const key of Object.keys(loopObject)) {
      if (key !== 'reverse') {
        throw new Error(
          `[useEntityAnimation] config.loop.${key} is unsupported`,
        )
      }
    }
    if (
      loopObject.reverse !== undefined &&
      typeof loopObject.reverse !== 'boolean'
    ) {
      throw new Error(
        '[useEntityAnimation] config.loop.reverse must be a boolean',
      )
    }
    loop = { reverse: loopObject.reverse as boolean | undefined }
  }
  if (config.autoStart !== undefined && typeof config.autoStart !== 'boolean') {
    throw new Error('[useEntityAnimation] config.autoStart must be a boolean')
  }

  return {
    duration,
    timingFunction:
      validateTimingFunction(config.timingFunction, 'config.timingFunction') ??
      'easeInOut',
    delay,
    playbackRate,
    loop,
  }
}

function parsePercentage(key: string): number {
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)%$/.test(key)) {
    throw new Error(
      `[useEntityAnimation] timeline key "${key}" must be a percentage`,
    )
  }
  const percentage = Number(key.slice(0, -1))
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error(
      `[useEntityAnimation] timeline percentage "${key}" must be in [0%, 100%]`,
    )
  }
  return percentage
}

function buildFrames(
  config: Record<string, unknown>,
  duration: number,
  emitPrecedenceWarning: boolean,
): ScalarFrame[] {
  if (config.timeline === undefined) {
    const from =
      config.from === undefined
        ? undefined
        : collectPatch(config.from, 'config.from', false)
    const to =
      config.to === undefined
        ? undefined
        : collectPatch(config.to, 'config.to', false)
    if (config.from === undefined || config.to === undefined) {
      throw new Error(
        '[useEntityAnimation] top-level config requires both from and to',
      )
    }
    return [
      { at: 0, values: from!.values },
      { at: duration, values: to!.values },
    ]
  }

  if (
    emitPrecedenceWarning &&
    (typeof process === 'undefined' ||
      process.env?.NODE_ENV !== 'production') &&
    (config.from !== undefined || config.to !== undefined)
  ) {
    console.warn(
      '[useEntityAnimation] timeline takes precedence; top-level from/to are ignored',
    )
  }
  const timeline = assertRecord(config.timeline, 'config.timeline')
  if (Object.keys(timeline).length === 0) {
    throw new Error('[useEntityAnimation] config.timeline must not be empty')
  }
  if (timeline.from !== undefined && timeline['0%'] !== undefined) {
    throw new Error('[useEntityAnimation] duplicate 0% boundary')
  }
  if (timeline.to !== undefined && timeline['100%'] !== undefined) {
    throw new Error('[useEntityAnimation] duplicate 100% boundary')
  }
  if (
    (timeline.from === undefined && timeline['0%'] === undefined) ||
    (timeline.to === undefined && timeline['100%'] === undefined)
  ) {
    throw new Error(
      '[useEntityAnimation] timeline requires start and end boundaries',
    )
  }

  const frames = new Map<number, ScalarFrame>()
  for (const [key, value] of Object.entries(timeline)) {
    const percentage =
      key === 'from' ? 0 : key === 'to' ? 100 : parsePercentage(key)
    const at = (percentage / 100) * duration
    if (frames.has(at)) {
      throw new Error(
        `[useEntityAnimation] duplicate normalized percentage at ${percentage}%`,
      )
    }
    const frame = collectPatch(value, `config.timeline.${key}`, true)
    frames.set(at, {
      at,
      values: frame.values,
      timingFunction: frame.timingFunction,
    })
  }
  return [...frames.values()].sort((a, b) => a.at - b.at)
}

/**
 * Normalizes public Entity motion authoring into canonical scalar tracks.
 *
 * @param config - Public Entity motion configuration.
 * @param emitPrecedenceWarning - Whether timeline precedence emits its public warning.
 * @returns Canonical Entity-specific timeline payload.
 */
export function normalizeEntityMotionConfig(
  config: EntityMotionConfig,
  emitPrecedenceWarning = true,
): EntityMotionTimelinePayload {
  const record = assertRecord(config, 'config')
  const common = validateCommonConfig(record)
  if (record.timeline !== undefined && common.duration === undefined) {
    throw new Error(
      '[useEntityAnimation] config.duration is required with timeline',
    )
  }
  const duration = common.duration ?? 0.3
  const frames = buildFrames(record, duration, emitPrecedenceWarning)

  return {
    duration,
    delay: common.delay,
    playbackRate: common.playbackRate,
    loop: common.loop,
    tracks: ENTITY_MOTION_PROPERTIES.flatMap(property => {
      const keyframes = frames.flatMap(frame => {
        const value = frame.values.get(property)
        if (value === undefined) return []
        return [
          {
            at: frame.at,
            value,
            ...(frame.timingFunction === undefined
              ? {}
              : { timingFunction: frame.timingFunction }),
          },
        ]
      })
      return keyframes.length === 0
        ? []
        : [
            {
              property,
              keyframes,
              timingFunction: common.timingFunction,
            },
          ]
    }),
  }
}

/**
 * Validates public Entity motion configuration synchronously.
 *
 * @param config - Configuration to validate.
 */
export function validateEntityMotionConfig(config: EntityMotionConfig): void {
  normalizeEntityMotionConfig(config, false)
}

/**
 * Validates one sparse committed-transform update.
 *
 * @param update - Sparse update supplied to `EntityPlaybackApi.set`.
 */
export function validateEntityTransformUpdate(
  update: EntityTransformUpdate,
): void {
  collectPatch(update, 'update', false)
}

/**
 * Produces a detached Entity motion wire payload.
 *
 * @param timeline - Canonical normalized timeline.
 * @returns Detached payload safe to pass to the bridge.
 */
export function serializeEntityMotionTimeline(
  timeline: EntityMotionTimelinePayload,
): EntityMotionTimelinePayload {
  return {
    ...timeline,
    loop:
      typeof timeline.loop === 'object' ? { ...timeline.loop } : timeline.loop,
    tracks: timeline.tracks.map(track => ({
      ...track,
      keyframes: track.keyframes.map(keyframe => ({ ...keyframe })),
    })),
  }
}
