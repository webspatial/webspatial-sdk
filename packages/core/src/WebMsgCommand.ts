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
