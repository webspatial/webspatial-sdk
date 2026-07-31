import type { Vec3 } from '../types'
import type { TimingFunction } from '../animation'
import type {
  SpatializedMotionPlayState,
  SpatializedPlaybackApi,
} from './spatializedMotion'
import type { SpatializedPlaybackError } from './spatializedPlayback'

/** Transform values confirmed by the native Entity motion implementation. */
export interface EntityMotionProps {
  /** Complete confirmed position in meters. */
  position?: Vec3
  /** Complete confirmed Euler rotation in degrees. */
  rotation?: Vec3
  /** Complete confirmed scale multipliers. */
  scale?: Vec3
}

/** Sparse transform values accepted in Entity motion authoring. */
export interface EntityMotionPatch {
  /** Sparse position axes in meters. */
  position?: Partial<Vec3>
  /** Sparse Euler rotation axes in degrees. */
  rotation?: Partial<Vec3>
  /** Sparse scale axes as non-negative multipliers. */
  scale?: Partial<Vec3>
}

/** Sparse committed-transform update accepted by `EntityPlaybackApi.set`. */
export interface EntityTransformUpdate extends EntityMotionPatch {}

/** One public Entity motion timeline frame. */
export interface EntityMotionFrame extends EntityMotionPatch {
  /** Easing for the segment beginning at this frame. */
  timingFunction?: TimingFunction
}

/** Public Entity motion timeline with named or percentage boundaries. */
export type EntityMotionTimeline = {
  /** Start boundary, equivalent to `0%`. */
  from?: EntityMotionFrame
  /** End boundary, equivalent to `100%`. */
  to?: EntityMotionFrame
} & Partial<Record<`${number}%`, EntityMotionFrame>>

/** Public Entity motion configuration. */
export interface EntityMotionConfig {
  /** Top-level start-boundary shorthand. */
  from?: EntityMotionPatch
  /** Top-level end-boundary shorthand. */
  to?: EntityMotionPatch
  /** Percentage timeline authoring; takes precedence over top-level boundaries. */
  timeline?: EntityMotionTimeline
  /** Playback duration in seconds. */
  duration?: number
  /** Default easing for timeline segments. */
  timingFunction?: TimingFunction
  /** Playback delay in seconds. */
  delay?: number
  /** Playback speed multiplier. */
  playbackRate?: number
  /** Infinite loop configuration. */
  loop?: boolean | { reverse?: boolean }
  /** Whether playback starts after native object creation. */
  autoStart?: boolean
  /** Called with the complete confirmed start pose. */
  onStart?: (values: EntityMotionProps) => void
  /** Called with the complete confirmed terminal pose. */
  onComplete?: (values: EntityMotionProps) => void
  /** Called with the complete confirmed stopped pose. */
  onStop?: (values: EntityMotionProps) => void
  /** Called with the complete confirmed reset pose. */
  onReset?: (values: EntityMotionProps) => void
  /** Called for one classified bridge or native failure. */
  onError?: (error: SpatializedPlaybackError) => void
}

/** Scalar Entity transform property accepted by the canonical timeline. */
export const ENTITY_MOTION_PROPERTIES = [
  'position.x',
  'position.y',
  'position.z',
  'rotation.x',
  'rotation.y',
  'rotation.z',
  'scale.x',
  'scale.y',
  'scale.z',
] as const

/** Scalar Entity transform property accepted by the canonical timeline. */
export type EntityMotionProperty = (typeof ENTITY_MOTION_PROPERTIES)[number]

/** One canonical numeric Entity motion keyframe. */
export interface EntityMotionKeyframe {
  /** Time in seconds from timeline start. */
  at: number
  /** Scalar value at this keyframe. */
  value: number
  /** Optional easing override for the segment beginning here. */
  timingFunction?: TimingFunction
}

/** One canonical Entity motion property track. */
export interface EntityMotionTrack {
  /** Transform scalar controlled by this track. */
  property: EntityMotionProperty
  /** Ordered sparse keyframes for this scalar. */
  keyframes: EntityMotionKeyframe[]
  /** Default easing for keyframes without an override. */
  timingFunction: TimingFunction
}

/** Canonical wire payload sent by `CreateEntityAnimation`. */
export interface EntityMotionTimelinePayload {
  /** Timeline duration in seconds. */
  duration: number
  /** Playback delay in seconds. */
  delay: number
  /** Playback speed multiplier. */
  playbackRate: number
  /** Infinite loop configuration. */
  loop: boolean | { reverse?: boolean }
  /** Canonical per-scalar tracks. */
  tracks: EntityMotionTrack[]
}

/** Entity playback controls and committed-transform setter. */
export interface EntityPlaybackApi extends SpatializedPlaybackApi {
  /** Commits a sparse transform update; confirmed values arrive through `entityProps`. */
  set(update: EntityTransformUpdate): void
  /** Current React or native Entity motion state. */
  readonly playState: SpatializedMotionPlayState
}

/** Wire request for creating an Entity animation on a target Entity id. */
export interface CreateEntityAnimationCommand {
  /** Target Entity `SpatialObject.id`. */
  id: string
  /** Canonical timeline consumed by Native. */
  timeline: EntityMotionTimelinePayload
}

/** Successful Entity animation creation result. */
export interface CreateEntityAnimationResult {
  /** Created Entity animation object's `SpatialObject.id`. */
  id: string
}

/** Playback control accepted by an Entity animation object. */
export type EntityAnimationControlType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'reset'
  | 'finish'
  | 'destroy'

/** Wire request for controlling an Entity animation object. */
export interface ControlEntityAnimationCommand {
  /** Entity animation object's `SpatialObject.id`. */
  id: string
  /** Requested playback or lifecycle control. */
  type: EntityAnimationControlType
}

/** Wire request for committing a sparse Entity transform update. */
export interface SetEntityAnimationCommand {
  /** Entity animation object's `SpatialObject.id`. */
  id: string
  /** Sparse transform update merged by Native. */
  update: EntityTransformUpdate
}

/** Successful Entity transform update result. */
export interface SetEntityAnimationResult {
  /** Complete transform confirmed by Native. */
  values: EntityMotionProps
}

/** Native playback states transported by Entity state events. */
export type EntityMotionNativePlayState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'finished'

/** Lifecycle callback actions transported by Entity state events. */
export type EntityMotionCallbackAction = 'start' | 'complete' | 'stop' | 'reset'

/** Detail transported by an Entity animation state event. */
export interface EntityMotionStateChangedDetail {
  /** Entity animation object's `SpatialObject.id`. */
  id: string
  /** Confirmed Native playback state. */
  playState: EntityMotionNativePlayState
  /** Optional lifecycle callback dispatched for this state confirmation. */
  callbackAction?: EntityMotionCallbackAction
  /** Complete confirmed transform paired with `callbackAction`. */
  values?: EntityMotionProps
}

/** Dedicated Entity animation playback state event. */
export interface EntityMotionStateChangedMsg {
  /** Entity motion state event channel. */
  type: 'spatialanimationstatechanged'
  /** Confirmed state transition detail. */
  detail: EntityMotionStateChangedDetail
}

/** Detail transported by a dedicated Entity animation error event. */
export interface EntityAnimationErrorDetail {
  /** Entity animation object's `SpatialObject.id`. */
  id: string
  /** Classified asynchronous playback failure. */
  error: SpatializedPlaybackError
}

/** Dedicated asynchronous Entity animation error event. */
export interface EntityAnimationErrorMsg {
  /** Entity motion error event channel. */
  type: 'entityanimationerror'
  /** Classified error detail. */
  detail: EntityAnimationErrorDetail
}
