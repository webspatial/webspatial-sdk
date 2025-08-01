import { SpatialSceneOptions, SpatialSessionNew } from '@webspatial/core-sdk'

export function initScene(
  name: string,
  callback: (pre: SpatialSceneOptions) => SpatialSceneOptions,
) {
  return SpatialSessionNew.initScene(name, callback)
}
