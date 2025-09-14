import { SpatialTapEvent, Vec3 } from '@webspatial/core-sdk'

export type EntityProps = {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

export type EntityEventHandler = {
  onTap?: (event: SpatialTapEvent) => void
}
