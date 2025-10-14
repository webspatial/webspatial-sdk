import { Vec3 } from '@webspatial/core-sdk'
import { EntityRef } from './hooks'
import { SpatialTapEvent as CoreSpatialTapEvent } from '@webspatial/core-sdk'

export type EntityProps = {
  id?: string
  name?: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

type allTarget<T extends EntityRef> = {
  target: T
  currentTarget: T
}
export type SpatialTapEntityEvent<T extends EntityRef = EntityRef> =
  CoreSpatialTapEvent & allTarget<T>

export type EntityEventHandler = {
  onSpatialTap?: (event: SpatialTapEntityEvent) => void
}
