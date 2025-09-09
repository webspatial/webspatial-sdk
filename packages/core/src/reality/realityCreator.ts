import {
  CreateSpatialEntityCommand,
  CreateSpatialGeometryCommand,
} from '../JSBCommand'
import { SpatialGeometryCreationOptions } from '../types/types'
import { SpatialEntity } from './SpatialEntity'
import { SpatialGeometry } from './SpatialGeometry'

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

export async function createSpatialGeometry(
  options: SpatialGeometryCreationOptions,
) {
  const result = await new CreateSpatialGeometryCommand(options).execute()
  if (!result.success) {
    throw new Error('createSpatialGeometry failed')
  } else {
    const { id } = result.data
    return new SpatialGeometry(id, options)
  }
}
