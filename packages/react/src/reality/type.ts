import { SpatialTapEvent, Vec3 } from '@webspatial/core-sdk'

export type EntityProps = {
  id?: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

export type EntityEventHandler = {
  onSpatialTap?: (event: SpatialTapEvent) => void
}
