import type { SpatialSceneCreationOptions } from '@webspatial/core-sdk'
import { getSession } from './utils'

export function initScene(
  name: string,
  callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
) {
  return getSession()?.initScene(name, callback)
}
