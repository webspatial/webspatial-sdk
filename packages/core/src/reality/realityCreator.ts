import {
  CreateSpatialEntityCommand,
  CreateSpatialGeometryCommand,
} from '../JSBCommand'
import { SpatialGeometryOptions } from '../types/types'
import { SpatialEntity } from './SpatialEntity'
import { SpatialGeometry } from './geometry/SpatialGeometry'

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
