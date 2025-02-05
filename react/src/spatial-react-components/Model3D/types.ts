import { vecType, quatType } from '../types'

export type SpatialTransformType = {
  position: vecType
  rotation: quatType
  scale: vecType
}

export type PartialSpatialTransformType = {
  position?: Partial<vecType>
  rotation?: Partial<quatType>
  scale?: Partial<vecType>
}
