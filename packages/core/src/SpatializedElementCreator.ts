import {
  createSpatialized2DElementCommand,
  CreateSpatializedDynamic3DElementCommand,
  CreateSpatializedStatic3DElementCommand,
} from './JSBCommand'
import { Spatialized2DElement } from './Spatialized2DElement'
import { SpatializedStatic3DElement } from './SpatializedStatic3DElement'
import { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'

export async function createSpatialized2DElement(): Promise<Spatialized2DElement> {
  const result = await new createSpatialized2DElementCommand().execute()
  if (!result.success) {
    throw new Error('createSpatialized2DElement failed')
  } else {
    const { id, windowProxy } = result.data!
    return new Spatialized2DElement(id, windowProxy)
  }
}

export async function createSpatializedStatic3DElement(
  modelURL: string,
): Promise<SpatializedStatic3DElement> {
  const result = await new CreateSpatializedStatic3DElementCommand(
    modelURL,
  ).execute()
  if (!result.success) {
    throw new Error('createSpatializedStatic3DElement failed')
  } else {
    const { id } = result.data
    return new SpatializedStatic3DElement(id)
  }
}

export async function createSpatializedDynamic3DElement(): Promise<SpatializedDynamic3DElement> {
  const result = await new CreateSpatializedDynamic3DElementCommand().execute()
  if (!result.success) {
    throw new Error('createSpatializedDynamic3DElement failed')
  } else {
    const { id } = result.data
    return new SpatializedDynamic3DElement(id)
  }
}
