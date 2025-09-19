import { Vec3 } from '@webspatial/core-sdk'
import { SpatialTapEvent } from '../spatialized-container'

export type EntityProps = {
  id?: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

export type EntityEventHandler = {
  onSpatialTap?: (event: SpatialTapEvent) => void
}
