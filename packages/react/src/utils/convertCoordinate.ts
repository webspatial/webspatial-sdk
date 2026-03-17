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

type CoordinateConvertible =
  | Window
  | SpatializedElementRef<any>
  | EntityRef
  | ModelRef
export function convertCoordinate(
  position: Vec3,
  { from, to }: { from: CoordinateConvertible; to: CoordinateConvertible },
) {
  return position
}
