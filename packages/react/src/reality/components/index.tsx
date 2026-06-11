import React from 'react'
import type { SpatialEntityNameLiteral } from '@webspatial/core-sdk'
import { EntityRefShape } from '../hooks'

import { Entity as EntityBase } from './Entity'
import { BoxEntity as BoxEntityBase } from './BoxEntity'
import { SphereEntity as SphereEntityBase } from './SphereEntity'
import { ConeEntity as ConeEntityBase } from './ConeEntity'
import { CylinderEntity as CylinderEntityBase } from './CylinderEntity'
import { PlaneEntity as PlaneEntityBase } from './PlaneEntity'
import { ModelEntity as ModelEntityBase } from './ModelEntity'
import { SceneGraph } from './SceneGraph'

type WithEntityName<Props, Name extends string> = Omit<Props, 'name'> & {
  name?: SpatialEntityNameLiteral<Name>
}

type EntityComponent<Component extends React.ComponentType<any>> = <
  Name extends string = string,
>(
  props: WithEntityName<React.ComponentPropsWithoutRef<Component>, Name> &
    React.RefAttributes<EntityRefShape>,
) => React.ReactElement | null

export const Entity = EntityBase as EntityComponent<typeof EntityBase>
export const BoxEntity = BoxEntityBase as EntityComponent<typeof BoxEntityBase>
export const SphereEntity = SphereEntityBase as EntityComponent<
  typeof SphereEntityBase
>
export const ConeEntity = ConeEntityBase as EntityComponent<
  typeof ConeEntityBase
>
export const CylinderEntity = CylinderEntityBase as EntityComponent<
  typeof CylinderEntityBase
>
export const PlaneEntity = PlaneEntityBase as EntityComponent<
  typeof PlaneEntityBase
>
export const ModelEntity = ModelEntityBase as EntityComponent<
  typeof ModelEntityBase
>

export { UnlitMaterial } from './UnlitMaterial'
export { Texture } from './Texture'
export { SceneGraph }
export { ModelAsset } from './ModelAsset'
export { Reality } from './Reality'
export { AttachmentAsset } from './AttachmentAsset'
export { AttachmentEntity } from './AttachmentEntity'
export { BoxEntity as Box }
export { PlaneEntity as Plane }
export { SphereEntity as Sphere }
export { ConeEntity as Cone }
export { CylinderEntity as Cylinder }
export { SceneGraph as World }
export * from './Material'
