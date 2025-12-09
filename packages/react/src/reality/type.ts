import { Vec3 } from '@webspatial/core-sdk'
import { EntityRefShape } from './hooks'
import { SpatialTapEvent as CoreSpatialTapEvent } from '@webspatial/core-sdk'
import { SpatialDragEvent as CoreSpatialDragEvent } from '@webspatial/core-sdk'
import { SpatialRotateEvent as CoreSpatialRotateEvent } from '@webspatial/core-sdk'
import { SpatialRotateEndEvent as CoreSpatialRotateEndEvent } from '@webspatial/core-sdk'
import { SpatialMagnifyEvent as CoreSpatialMagnifyEvent } from '@webspatial/core-sdk'
import { SpatialMagnifyEndEvent as CoreSpatialMagnifyEndEvent } from '@webspatial/core-sdk'

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
// tap
export type SpatialTapEntityEvent<T extends EntityRefShape = EntityRefShape> =
  CoreSpatialTapEvent & allTarget<T>
// drag
export type SpatialDragEntityEvent<T extends EntityRefShape = EntityRefShape> =
  CoreSpatialDragEvent & allTarget<T>
// rotate
export type SpatialRotateEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialRotateEvent & allTarget<T>
export type SpatialRotateEndEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialRotateEndEvent & allTarget<T>
// magnify
export type SpatialMagnifyEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialMagnifyEvent & allTarget<T>
export type SpatialMagnifyEndEntityEvent<
  T extends EntityRefShape = EntityRefShape,
> = CoreSpatialMagnifyEndEvent & allTarget<T>

export type EntityEventHandler = {
  // tap
  onSpatialTap?: (event: SpatialTapEntityEvent) => void
  // drag
  onSpatialDragStart?: (event: SpatialDragEntityEvent) => void
  onSpatialDrag?: (event: SpatialDragEntityEvent) => void
  onSpatialDragEnd?: (event: SpatialDragEntityEvent) => void
  // rotate
  onSpatialRotateStart?: (event: SpatialRotateEntityEvent) => void
  onSpatialRotate?: (event: SpatialRotateEntityEvent) => void
  onSpatialRotateEnd?: (event: SpatialRotateEndEntityEvent) => void
  // magnify
  onSpatialMagnifyStart?: (event: SpatialMagnifyEntityEvent) => void
  onSpatialMagnify?: (event: SpatialMagnifyEntityEvent) => void
  onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEntityEvent) => void
}

export const eventMap = {
  // tap
  onSpatialTap: 'spatialtap',
  // drag
  onSpatialDragStart: 'spatialdragstart',
  onSpatialDrag: 'spatialdrag',
  onSpatialDragEnd: 'spatialdragend',
  // rotate
  onSpatialRotateStart: 'spatialrotatestart',
  onSpatialRotate: 'spatialrotate',
  onSpatialRotateEnd: 'spatialrotateend',
  // magnify
  onSpatialMagnifyStart: 'spatialmagnifystart',
  onSpatialMagnify: 'spatialmagnify',
  onSpatialMagnifyEnd: 'spatialmagnifyend',
} as const
