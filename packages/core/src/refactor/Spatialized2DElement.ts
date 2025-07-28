import { SpatializedElement } from './SpatializedElement'

export class Spatialized2DElement extends SpatializedElement {
  constructor(
    id: string,
    readonly windowProxy: WindowProxy,
  ) {
    super(id)
  }
}
