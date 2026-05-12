/**
 * const e2e = await convertCoordinate(position, { from: elementOrEntity, to: elementOrEntity })
const e2w = await convertCoordinate(position, { from: elementOrEntity, to: window })
const w2e = await convertCoordinate(position, { from: window, to: elementOrEntity })
 * 
 */
import type { Vec3 } from '@webspatial/core-sdk'
import type { SpatializedElementRef } from '../spatialized-container/types'
import type { EntityRef } from '../reality'
import type { ModelRef } from '../Model'
import { getSpatialImpl } from '../runtime/bridge'
import { SpatialID } from '../spatialized-container/SpatialID'

// Per the lazy-load proposal `tasks.md §12.9` ("Pre-v1 budget calibration"),
// `convertCoordinate` no longer statically imports `getSession` from
// `./getSession`. That import would pull `Spatial` + `SpatialSession`
// (and through `SpatialSession`, the entire spatial creator class graph
// + `scene-polyfill`) into the default-entry bundle. The function's
// existing graceful-degradation contract (`if (!spatialScene) return
// position`) extends naturally to the bridge-routed lookup: before
// `await bootSpatial()` resolves, `getSpatialImpl()` returns `null`
// and we return the input position unchanged — same observable behavior
// as the previous "no spatial session" branch, just reached via the
// dynamic-import bridge instead of a static import.

type CoordinateConvertible =
  | Window
  | SpatializedElementRef<any>
  | EntityRef
  | ModelRef

function resolveSpatialObjectId(target: CoordinateConvertible): string | null {
  // window -> current spatial scene id which is empty string
  if (typeof window !== 'undefined' && target === window) {
    const scene = getSpatialImpl()?.getSession?.()?.getSpatialScene()
    return scene?.id ?? ''
  }

  // EntityRef -> underlying SpatialEntity.id
  const maybeEntity = target as EntityRef
  if (
    maybeEntity &&
    typeof maybeEntity === 'object' &&
    'entity' in maybeEntity
  ) {
    return maybeEntity.entity?.id ?? null
  }

  // SpatializedElementRef / ModelRef -> underlying SpatializedElement.id
  const dom: any = target as any
  if (dom && typeof dom === 'object') {
    const spatializedElement =
      dom.__spatializedElement ?? dom.__innerSpatializedElement?.()
    if (spatializedElement && spatializedElement.id) {
      return spatializedElement.id as string
    }
  }

  return null
}

export async function convertCoordinate(
  position: Vec3,
  { from, to }: { from: CoordinateConvertible; to: CoordinateConvertible },
): Promise<Vec3> {
  try {
    const fromId = resolveSpatialObjectId(from)
    const toId = resolveSpatialObjectId(to)
    if (fromId === null || toId === null) {
      console.warn(
        'convertCoordinate error: from or to is not a valid coordinate convertible',
      )
      return position
    }

    const spatialScene = getSpatialImpl()?.getSession?.()?.getSpatialScene()
    if (!spatialScene) return position
    const ret = await spatialScene.convertCoordinate(position, fromId, toId)
    return ret ?? position
  } catch (error) {
    console.warn('convertCoordinate error:', error)
    return position
  }
}
