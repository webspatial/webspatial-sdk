import {
  CreateModelComponentCommand,
  CreateSpatialEntityCommand,
  CreateSpatialGeometryCommand,
  CreateSpatialUnlitMaterialCommand,
} from '../JSBCommand'
import { ModelComponentOptions, SpatialGeometryOptions, SpatialUnlitMaterialOptions } from '../types/types'
import { SpatialEntity } from './SpatialEntity'
import { ModelComponent } from './component/ModelComponent'
import { SpatialComponent } from './component/SpatialComponent'
import { SpatialGeometry } from './geometry/SpatialGeometry'
import { SpatialUnlitMaterial } from './material/SpatialUnlitMaterial'

export async function createSpatialEntity(
  name?: string,
): Promise<SpatialEntity> {
  const result = await new CreateSpatialEntityCommand(name).execute()
  if (!result.success) {
    throw new Error('createSpatialEntity failed')
  } else {
    const { id } = result.data
    return new SpatialEntity(id, name)
  }
}

export async function createSpatialGeometry<T extends SpatialGeometry>(
  ctor: new (...args: any[]) => T,
  options: SpatialGeometryOptions,
) {
  const result = await new CreateSpatialGeometryCommand(
    (ctor as any).type,
    options,
  ).execute()
  if (!result.success) {
    throw new Error('createSpatialGeometry failed')
  } else {
    const { id } = result.data
    return new ctor(id, options) as T
  }
}

export async function createSpatialUnlitMaterial(
  options: SpatialUnlitMaterialOptions,
) {
  const result = await new CreateSpatialUnlitMaterialCommand(
    options,
  ).execute()
  if (!result.success) {
    throw new Error('createSpatialUnlitMaterial failed')
  } else {
    const { id } = result.data
    return new SpatialUnlitMaterial(id, options)
  }
}

export async function createModelComponent(
  options: ModelComponentOptions,
) {
  const result = await new CreateModelComponentCommand(
    options,
  ).execute()
  if (!result.success) {
    throw new Error('createSpatialGeometry failed')
  } else {
    const { id } = result.data
    return new ModelComponent(id, options)
  }
}
