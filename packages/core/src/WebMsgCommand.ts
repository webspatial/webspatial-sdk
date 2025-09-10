import {
  Vec3,
  Size3D,
  SpatialDragEventDetail,
  SpatialTapEventDetail,
  SpatialRotationEventDetail,
  SpatialMagnifyEventDetail,
} from './types/types'

export enum SpatialWebMsgType {
  cubeInfo = 'cubeInfo',
  transform = 'transform',
  spatialtap = 'spatialtap',
  spatialdragstart = 'spatialdragstart',
  spatialdrag = 'spatialdrag',
  spatialdragend = 'spatialdragend',
  spatialrotation = 'spatialrotation',
  spatialrotationend = 'spatialrotationend',
  spatialmagnify = 'spatialmagnify',
  spatialmagnifyend = 'spatialmagnifyend',
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

export interface SpatialDragMsg {
  type: SpatialWebMsgType.spatialdrag
  detail: SpatialDragEventDetail
}

export interface SpatialDragEndMsg {
  type: SpatialWebMsgType.spatialdragend
  detail: SpatialDragEventDetail
}

export interface SpatialRotationMsg {
  type: SpatialWebMsgType.spatialrotation
  detail: SpatialRotationEventDetail
}

export interface SpatialRotationEndMsg {
  type: SpatialWebMsgType.spatialrotationend
  detail: SpatialRotationEventDetail
}

export interface SpatialMagnifyMsg {
  type: SpatialWebMsgType.spatialmagnify
  detail: SpatialMagnifyEventDetail
}

export interface SpatialMagnifyEndMsg {
  type: SpatialWebMsgType.spatialmagnifyend
  detail: SpatialMagnifyEventDetail
}
