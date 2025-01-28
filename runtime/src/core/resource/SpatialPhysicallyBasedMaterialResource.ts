import { SpatialModelComponent } from '../component'
import { WebSpatial } from '../private/WebSpatial'
import { SpatialObject } from '../SpatialObject'

/**
 * PBR material which can be set on a SpatialModelComponent
 */
export class SpatialPhysicallyBasedMaterialResource extends SpatialObject {
  /**
   * Base color of the material containing rgba between 0 and 1
   */
  baseColor = { r: 0.0, g: 0.7, b: 0.7, a: 1.0 }
  /**
   * PBR metalic value between 0 and 1
   */
  metallic = { value: 0.5 }
  /**
   * PBR roughness value between 0 and 1
   */
  roughness = { value: 0.5 }

  _modelComponentAttachedTo: { [key: string]: SpatialModelComponent } = {}
  _addToComponent(c: SpatialModelComponent) {
    this._modelComponentAttachedTo[c._resource.id] = c
  }

  /**
   * Syncs state of color, metallic, roupghness to the renderer
   */
  async update() {
    await WebSpatial.updateResource(this._resource, {
      baseColor: this.baseColor,
      metallic: this.metallic,
      roughness: this.roughness,
    })

    // Since realitykit's materials are structs and not references, every time we change a material, we must copy it to all of the components its attached to to observe the update
    for (var key in this._modelComponentAttachedTo) {
      await this._modelComponentAttachedTo[key]._syncMaterials()
    }
  }
}
