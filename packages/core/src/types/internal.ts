import { SpatialSceneCreationOptions, SpatialSceneType } from './types'

export type SpatialSceneCreationOptionsInternal =
  SpatialSceneCreationOptions & {
    type: SpatialSceneType
  }
export enum SpatialSceneState {
  idle = 'idle',
  pending = 'pending',
  willVisible = 'willVisible',
  visible = 'visible',
  fail = 'fail',
}
