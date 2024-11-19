import { WebSpatial } from "../private/WebSpatial"
import { SpatialObject } from "../SpatialObject"
 
/**
* PBR material which can be set on a SpatialModelComponent
*/
export class SpatialPhysicallyBasedMaterial extends SpatialObject {
    baseColor = { r: 0.0, g: 0.7, b: 0.7, a: 1.0 }
    metallic = { value: 0.5 }
    roughness = { value: 0.5 }
  
    /**
     * Syncs state of color, metallic, roupghness to the renderer
     */
    async update() {
      await WebSpatial.updateResource(this._resource, {
        baseColor: this.baseColor,
        metallic: this.metallic,
        roughness: this.roughness
      })
    }
  }