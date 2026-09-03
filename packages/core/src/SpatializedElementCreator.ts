import {
  CreateSpatializedDynamic3DElementCommand,
  CreateSpatializedStatic3DElementCommand,
} from './JSBCommand'
import { Spatialized2DElement } from './Spatialized2DElement'
import { SpatializedStatic3DElement } from './SpatializedStatic3DElement'
import { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
import { createNativeSpatialDiv } from './spatial-host'
import { ModelLoadingMode, ModelSource } from './types/types'

export const WEBSPATIAL_ANCHOR_UID_ATTR = 'data-webspatial-anchor-uid'

export function createAnchorUid(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = (Math.random() * 16) | 0
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export async function createSpatialized2DElement(): Promise<Spatialized2DElement> {
  const result = await createNativeSpatialDiv()
  if (!result.success) {
    throw new Error('createSpatialized2DElement failed')
  } else {
    const { id, windowProxy } = result.data!
    // set base href to make sure the relative url is correct
    windowProxy.document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1">
      <base href="${document.baseURI}">`
    return new Spatialized2DElement(id, windowProxy)
  }
}

export async function createSpatializedStatic3DElement(
  modelURL?: string,
  sources?: ModelSource[],
  loading: ModelLoadingMode = 'eager',
): Promise<SpatializedStatic3DElement> {
  const anchorUid = createAnchorUid()
  const result = await new CreateSpatializedStatic3DElementCommand(
    modelURL,
    sources,
    loading,
    anchorUid,
  ).execute()
  if (!result.success) {
    throw new Error('createSpatializedStatic3DElement failed')
  } else {
    const { id } = result.data
    return new SpatializedStatic3DElement(
      id,
      modelURL,
      sources,
      loading,
      anchorUid,
    )
  }
}

export async function createSpatializedDynamic3DElement(): Promise<SpatializedDynamic3DElement> {
  const anchorUid = createAnchorUid()
  const result = await new CreateSpatializedDynamic3DElementCommand(
    anchorUid,
  ).execute()
  if (!result.success) {
    throw new Error('createSpatializedDynamic3DElement failed')
  } else {
    const { id } = result.data
    return new SpatializedDynamic3DElement(id, anchorUid)
  }
}
