import { SpatialComponent } from './SpatialComponent'
import { Vec3, WebSpatial } from '../private/WebSpatial'

/**
 * Used to position a model3d in 3D space
 */
export class SpatialModel3DComponent extends SpatialComponent {
  /**
   * Sets the resolution of the spatial view in dom pixels
   */
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, {
      resolution: { x: x, y: y },
    })
  }

  async setRotationAnchor(rotationAnchor: Vec3) {
    await WebSpatial.updateResource(this._resource, {
      rotationAnchor: rotationAnchor,
    })
  }

  /**
   * Sets the opacity of the model
   * @param opacity
   */
  async setOpacity(opacity: number) {
    await WebSpatial.updateResource(this._resource, {
      opacity,
    })
  }
}
