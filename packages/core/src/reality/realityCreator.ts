import {
  CreateModelComponentCommand,
  CreateModelAssetCommand,
  CreateSpatialEntityCommand,
  CreateSpatialGeometryCommand,
  CreateSpatialModelEntityCommand,
  CreateSpatialUnlitMaterialCommand,
} from '../JSBCommand'
import {
  ModelComponentOptions,
  ModelAssetOptions,
  SpatialGeometryOptions,
  SpatialModelEntityCreationOptions,
  SpatialUnlitMaterialOptions,
  SpatialEntityUserData,
} from '../types/types'
import { SpatialEntity, SpatialModelEntity } from './entity'
import { ModelComponent } from './component'
import { SpatialGeometry } from './geometry'
import { SpatialUnlitMaterial } from './material'
import { SpatialModelAsset } from './resource'

export async function createSpatialEntity(
  userData?: SpatialEntityUserData,
): Promise<SpatialEntity> {
  const result = await new CreateSpatialEntityCommand(userData?.name).execute()
  if (!result.success) {
    throw new Error('createSpatialEntity failed:' + result?.errorMessage)
  } else {
    const { id } = result.data
    return new SpatialEntity(id, userData)
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
    throw new Error('createSpatialGeometry failed:' + result?.errorMessage)
  } else {
    const { id } = result.data
    return new ctor(id, options) as T
  }
}

export async function createSpatialUnlitMaterial(
  options: SpatialUnlitMaterialOptions,
) {
  const result = await new CreateSpatialUnlitMaterialCommand(options).execute()
  if (!result.success) {
    throw new Error('createSpatialUnlitMaterial failed:' + result?.errorMessage)
  } else {
    const { id } = result.data
    return new SpatialUnlitMaterial(id, options)
  }
}

export async function createModelComponent(options: ModelComponentOptions) {
  const result = await new CreateModelComponentCommand(options).execute()
  if (!result.success) {
    throw new Error('createModelComponent failed:' + result?.errorMessage)
  } else {
    const { id } = result.data
    return new ModelComponent(id, options)
  }
}

export async function createSpatialModelEntity(
  options: SpatialModelEntityCreationOptions,
  userData?: SpatialEntityUserData,
) {
  const result = await new CreateSpatialModelEntityCommand(options).execute()
  if (!result.success) {
    throw new Error('createSpatialModelEntity failed:' + result?.errorMessage)
  } else {
    const { id } = result.data
    return new SpatialModelEntity(id, options, userData)
  }
}

export async function createModelAsset(options: ModelAssetOptions) {
  const result = await new CreateModelAssetCommand(options).execute()
  if (!result.success) {
    throw new Error('createModelAsset failed:' + result?.errorMessage)
  } else {
    const { id } = result.data
    return new SpatialModelAsset(id, options)
  }
}
