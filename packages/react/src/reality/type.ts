import { Vec3 } from '@webspatial/core-sdk'
import { EntityRefShape } from './hooks'
import {
  SpatialTapEvent as CoreSpatialTapEvent,
  SpatialDragEvent as CoreSpatialDragEvent,
  SpatialDragEndEvent as CoreSpatialDragEndEvent,
  SpatialRotateEvent as CoreSpatialRotateEvent,
  SpatialRotateEndEvent as CoreSpatialRotateEndEvent,
  SpatialMagnifyEvent as CoreSpatialMagnifyEvent,
  SpatialMagnifyEndEvent as CoreSpatialMagnifyEndEvent,
} from '@webspatial/core-sdk'

export type EntityProps = {
  id?: string
  name?: string
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
}

type allTarget<T extends EntityRefShape> = {
  target: T
  currentTarget: T
}
export type SpatialTapEntityEvent<T extends EntityRefShape = EntityRefShape> =
  CoreSpatialTapEvent & allTarget<T>

export type SpatialDragStartEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialDragEvent & allTarget<T>

export type SpatialDragEntityEvent<T extends EntityRefShape = EntityRefShape> =
  CoreSpatialDragEvent & allTarget<T>

export type SpatialDragEndEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialDragEndEvent & allTarget<T>

export type SpatialRotateStartEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialRotateEvent & allTarget<T>

export type SpatialRotateEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialRotateEvent & allTarget<T>

export type SpatialRotateEndEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialRotateEndEvent & allTarget<T>

export type SpatialMagnifyStartEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialMagnifyEvent & allTarget<T>

export type SpatialMagnifyEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialMagnifyEvent & allTarget<T>

export type SpatialMagnifyEndEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialMagnifyEndEvent & allTarget<T>

export type EntityEventHandler = {
  onSpatialTap?: (event: SpatialTapEntityEvent) => void
  onSpatialDragStart?: (event: SpatialDragStartEntityEvent) => void
  onSpatialDrag?: (event: SpatialDragEntityEvent) => void
  onSpatialDragEnd?: (event: SpatialDragEndEntityEvent) => void
  onSpatialRotateStart?: (event: SpatialRotateStartEntityEvent) => void
  onSpatialRotate?: (event: SpatialRotateEntityEvent) => void
  onSpatialRotateEnd?: (event: SpatialRotateEndEntityEvent) => void
  onSpatialMagnifyStart?: (event: SpatialMagnifyStartEntityEvent) => void
  onSpatialMagnify?: (event: SpatialMagnifyEntityEvent) => void
  onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEntityEvent) => void
}

export const eventMap = {
  onSpatialTap: 'spatialtap',
  onSpatialDragStart: 'spatialdragstart',
  onSpatialDrag: 'spatialdrag',
  onSpatialDragEnd: 'spatialdragend',
  onSpatialRotateStart: 'spatialrotatestart',
  onSpatialRotate: 'spatialrotate',
  onSpatialRotateEnd: 'spatialrotateend',
  onSpatialMagnifyStart: 'spatialmagnifystart',
  onSpatialMagnify: 'spatialmagnify',
  onSpatialMagnifyEnd: 'spatialmagnifyend',
} as const
