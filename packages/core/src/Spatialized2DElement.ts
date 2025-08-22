import {
  AddSpatializedElementToSpatialized2DElement,
  UpdateSpatialized2DElementProperties,
} from './JSBCommand'
import { hijackWindowATag } from './scene-polyfill'
import { SpatializedElement } from './SpatializedElement'
import { Spatialized2DElementProperties } from './types/types'

export class Spatialized2DElement extends SpatializedElement {
  constructor(
    id: string,
    readonly windowProxy: WindowProxy,
  ) {
    super(id)
    // hijack a tag event
    hijackWindowATag(windowProxy)
  }

  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    return new UpdateSpatialized2DElementProperties(this, properties).execute()
  }

  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialized2DElement(
      this,
      element,
    ).execute()
  }
}
