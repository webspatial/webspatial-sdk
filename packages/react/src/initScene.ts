import type {
  SpatialSceneCreationOptions,
  SpatialSceneType,
} from '@webspatial/core-sdk'
import { getSpatialImpl } from './runtime/bridge'

// Per the lazy-load proposal `tasks.md §12.9` ("Pre-v1 budget calibration"),
// `initScene` no longer statically imports `getSession` from `./utils`.
// That import would pull `Spatial` + `SpatialSession` (and through
// `SpatialSession`, the entire spatial creator class graph + the 636 LoC
// `scene-polyfill`) into the default-entry bundle. Routing through
// `getSpatialImpl()?.getSession?.()` keeps `getSession` reachable only
// from the spatial chunk's static module graph, while preserving the
// "graceful no-op when no session is available" behavior consumers
// already relied on (the optional chaining returned `undefined` before
// boot anyway).
export function initScene(
  name: string,
  callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
  options?: { type: SpatialSceneType },
) {
  return getSpatialImpl()?.getSession?.()?.initScene(name, callback, options)
}
