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
import { getSession } from './getSession'
import { SpatialID } from '../spatialized-container/SpatialID'

type CoordinateConvertible =
  | Window
  | SpatializedElementRef<any>
  | EntityRef
  | ModelRef

function resolveSpatialObjectId(target: CoordinateConvertible): string | null {
  // window -> current spatial scene id which is empty string
  if (typeof window !== 'undefined' && target === window) {
    const scene = getSession()?.getSpatialScene()
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

  // SpatializedElementRef / ModelRef -> DOM proxy to underlying SpatializedElement.id
  const dom: any = (target as any)?.__raw ?? (target as any)
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
      return position
    }

    const spatialScene = getSession()?.getSpatialScene()
    if (!spatialScene) return position
    const ret = await spatialScene.convertCoordinate(position, fromId, toId)
    return ret ?? position
  } catch {
    return position
  }
}
