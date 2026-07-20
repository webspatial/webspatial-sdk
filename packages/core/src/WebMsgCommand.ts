import {
  SpatialDragEventDetail,
  SpatialTapEventDetail,
  SpatialRotateEventDetail,
  SpatialMagnifyEventDetail,
  SpatialDragStartEventDetail,
  SpatialDragEndEventDetail,
} from './types/types'

export enum SpatialWebMsgType {
  modelloaded = 'modelloaded',
  modelloadfailed = 'modelloadfailed',
  spatialtap = 'spatialtap',
  spatialdragstart = 'spatialdragstart',
  spatialdrag = 'spatialdrag',
  spatialdragend = 'spatialdragend',
  spatialrotate = 'spatialrotate',
  spatialrotateend = 'spatialrotateend',
  spatialmagnify = 'spatialmagnify',
  spatialmagnifyend = 'spatialmagnifyend',

  animationstatechange = 'animationstatechange',

  // Native-driven transform updates (e.g. while in `stagemode="orbit"`)
  entitytransformchange = 'entitytransformchange',

  // Animation terminal events (keyed by animationId, not by this enum)
  animationcompleted = 'animationcompleted',
  animationstopped = 'animationstopped',
  animationfailed = 'animationfailed',

  objectdestroy = 'objectdestroy',

  // Native asks JS to ship a `blob:` source's bytes (native cannot fetch blobs).
  modelblobrequest = 'modelblobrequest',
}

export interface ObjectDestroyMsg {
  type: SpatialWebMsgType.objectdestroy
}

export interface SpatialTapMsg {
  type: SpatialWebMsgType.spatialtap
  detail: SpatialTapEventDetail
}

export interface SpatialDragStartMsg {
  type: SpatialWebMsgType.spatialdragstart
  detail: SpatialDragStartEventDetail
}

export interface SpatialDragMsg {
  type: SpatialWebMsgType.spatialdrag
  detail: SpatialDragEventDetail
}

export interface SpatialDragEndMsg {
  type: SpatialWebMsgType.spatialdragend
  detail: SpatialDragEndEventDetail
}

export interface SpatialRotateMsg {
  type: SpatialWebMsgType.spatialrotate
  detail: SpatialRotateEventDetail
}

export interface SpatialRotateEndMsg {
  type: SpatialWebMsgType.spatialrotateend
  detail: SpatialRotateEventDetail
}

export interface SpatialMagnifyMsg {
  type: SpatialWebMsgType.spatialmagnify
  detail: SpatialMagnifyEventDetail
}

export interface SpatialMagnifyEndMsg {
  type: SpatialWebMsgType.spatialmagnifyend
  detail: SpatialMagnifyEventDetail
}

export interface ModelLoadSuccess {
  type: SpatialWebMsgType.modelloaded
  // detail object is undefined in old native runtimes
  detail?: { src: string }
}

export interface ModelLoadFailure {
  type: SpatialWebMsgType.modelloadfailed
}

export interface ModelBlobRequestDetail {
  /** The `blob:` URL native wants the bytes for. The element loads one blob at a
   * time, so `src` also correlates the `TransferModelBlobData` chunks JS sends back. */
  src: string
}

export interface ModelBlobRequestMsg {
  type: SpatialWebMsgType.modelblobrequest
  detail: ModelBlobRequestDetail
}

export interface AnimationStateChangeDetail {
  paused: boolean
  duration: number
  /**
   * Sampled animation playback position in seconds at `timestamp`.
   * Optional for compatibility with older native runtimes.
   */
  currentTime?: number
  /**
   * Unix epoch time in milliseconds at which `currentTime` was sampled.
   * Used to extrapolate `currentTime` between samples while playing.
   */
  timestamp?: number
}

export interface AnimationStateChangeMsg {
  type: SpatialWebMsgType.animationstatechange
  detail: AnimationStateChangeDetail
}

export interface EntityTransformChangeDetail {
  /** Column-major 4x4 matrix (16 numbers) representing the manipulated transform. */
  transform: number[]
}

export interface EntityTransformChangeMsg {
  type: SpatialWebMsgType.entitytransformchange
  detail: EntityTransformChangeDetail
}

// Animation terminal event payloads (delivered via SpatialWebEvent keyed by animationId)

export interface AnimationCompletedEventPayload {
  type: 'completed'
  /** Column-major 4x4 matrix (16 numbers) representing the final native transform. */
  transform: number[]
}

export interface AnimationCanceledEventPayload {
  type: 'canceled'
  /** Column-major 4x4 matrix (16 numbers) representing the restored transform after cancel. */
  transform: number[]
}

export interface AnimationFailedEventPayload {
  type: 'failed'
  animationId: string
  command: 'play' | 'pause' | 'resume' | 'cancel'
  code?: string
  reason: string
}
