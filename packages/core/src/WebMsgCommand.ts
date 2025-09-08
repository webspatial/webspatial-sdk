import {
  Vec3,
  Size3D,
  SpatialTransform,
  SpatialDragEventDetail,
  SpatialTapEventDetail,
  SpatialRotationEventDetail,
  SpatialMagnifyEventDetail,
} from './types/types'

export enum SpatialWebMsgType {
  CubeInfo = 'cubeInfo',
  Transform = 'transform',
  spatialtap = 'spatialtap',
  spatialdrag = 'spatialdrag',
  spatialdragend = 'spatialdragend',
  spatialrotation = 'spatialrotation',
  spatialrotationend = 'spatialrotationend',
  spatialmagnify = 'spatialmagnify',
  spatialmagnifyend = 'spatialmagnifyend',
}

export interface CubeInfoMsg {
  type: SpatialWebMsgType.CubeInfo
  origin: Vec3
  size: Size3D
}

export interface TransformMsg {
  type: SpatialWebMsgType.Transform
  transform: SpatialTransform
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
