import { SpatialResource } from "./SpatialResource"
import { WebSpatial } from "../webSpatialPrivate"
import { AnimationBuilder } from "../webSpatialComponents/AnimationBuilder"

/**
* Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
* Positioning behaves the same as a spatial window marked as dom space
*/
export class SpatialModelUIComponent extends SpatialResource {
  /**
   * Sets the url of the model to load
   * @param url url of the model to load
   */
  async setURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }
  async setAspectRatio(aspectRatio: string) {
    await WebSpatial.updateResource(this._resource, { aspectRatio: aspectRatio })
  }
  /**
   * Sets the resolution of the component to be displayed (behaves the same as inline window)
   * @param x resolution in pixels
   * @param y resolution in pixels
   */
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }

  async applyAnimationToResource(animationBuilder: AnimationBuilder) {
    const animationDescription = animationBuilder.build();
    await WebSpatial.applyAnimationToResource(this._resource, animationDescription)
  }
}
