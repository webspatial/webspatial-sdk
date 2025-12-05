import {
  SpatialSceneCreationOptions,
  SpatialSceneType,
} from '@webspatial/core-sdk'
import { getSession } from './utils'

export function initScene(
  name: string,
  callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
  options?: { type: SpatialSceneType },
) {
  return getSession()?.initScene(name, callback, options)
}
