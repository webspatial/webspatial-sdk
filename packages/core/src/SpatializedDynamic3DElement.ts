import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedElementProperties } from './types/types'
export class SpatializedDynamic3DElement extends SpatializedElement {
  updateProperties(
    properties: Partial<SpatializedElementProperties>,
  ): Promise<WebSpatialProtocolResult> {
    throw new Error('Method not implemented.')
  }
}
