import {
  Vec3,
  Size3D,
  SpatialTransform,
  SpatialDragEventDetail,
  SpatialTapEventDetail,
} from './types/types'

export enum SpatialWebMsgType {
  CubeInfo = 'cubeInfo',
  Transform = 'transform',
  spatialtap = 'spatialtap',
  spatialdrag = 'spatialdrag',
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

export interface SpatialTapMsg extends SpatialTapEventDetail {
  type: SpatialWebMsgType.spatialtap
}

export interface SpatialDragMsg extends SpatialDragEventDetail {
  type: SpatialWebMsgType.spatialdrag
}
