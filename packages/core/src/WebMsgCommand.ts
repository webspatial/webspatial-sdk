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

  objectdestroy = 'objectdestroy',
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

export interface AnimationStateChangeDetail {
  paused: boolean
  duration: number
}

export interface AnimationStateChangeMsg {
  type: SpatialWebMsgType.animationstatechange
  detail: AnimationStateChangeDetail
}
