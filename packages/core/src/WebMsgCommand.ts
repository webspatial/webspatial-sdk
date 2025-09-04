import { Vec3, Size, SpatialTransform } from './types/types'

export enum SpatialWebMsgType {
  CubeInfo = 'cubeInfo',
  Transform = 'transform',
}

export interface CubeInfoMsg {
  type: SpatialWebMsgType.CubeInfo
  origin: Vec3
  size: Size
}

export interface TransformMsg {
  type: SpatialWebMsgType.Transform
  transform: SpatialTransform
}
