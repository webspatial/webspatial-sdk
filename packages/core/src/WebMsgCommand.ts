import {
  Vec3,
  Size3D,
  SpatialDragEventDetail,
  SpatialTapEventDetail,
  SpatialRotateEventDetail,
  SpatialMagnifyEventDetail,
  SpatialDragStartEventDetail,
  SpatialDragEndEventDetail,
} from './types/types'

export enum SpatialWebMsgType {
  cubeInfo = 'cubeInfo',
  transform = 'transform',
  modelloaded = 'modelloaded',
  modelloadfailed = 'modelloadfailed',
  spatialtap = 'spatialtap',
  spatialdragstart = 'spatialdragstart',
  spatialdrag = 'spatialdrag',
  spatialdragend = 'spatialdragend',
  spatialrotatestart = 'spatialrotatestart',
  spatialrotate = 'spatialrotate',
  spatialrotateend = 'spatialrotateend',
  spatialmagnifystart = 'spatialmagnifystart',
  spatialmagnify = 'spatialmagnify',
  spatialmagnifyend = 'spatialmagnifyend',

  objectdestroy = 'objectdestroy',
}

export interface ObjectDestroyMsg {
  type: SpatialWebMsgType.objectdestroy
}

export interface CubeInfoMsg {
  type: SpatialWebMsgType.cubeInfo
  origin: Vec3
  size: Size3D
}

export interface CubeInfoMsg {
  type: SpatialWebMsgType.cubeInfo
  origin: Vec3
  size: Size3D
}

export interface TransformMsg {
  type: SpatialWebMsgType.transform
  detail: {
    column0: [number, number, number]
    column1: [number, number, number]
    column2: [number, number, number]
    column3: [number, number, number]
  }
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
