import { SpatialComponent } from "./SpatialComponent"
import { WebSpatial } from "../private/WebSpatial"

// export enum ModelAnimateOpacityEaseFn {
//   easeInOut = 'easeInOut'
// }

// export class AnimationBuilder {
//   private _fadeOut = false
//   private _fadeDuration = 1;

//   fadeOut(v: boolean) {
//       this._fadeOut = v;
//       return this
//   }

//   fadeDuration(v: number) {
//       this._fadeDuration = v;
//       return this
//   }

//   build() {
//       return {
//           fadeOut: this._fadeOut,
//           fadeDuration: this._fadeDuration
//       }
//   }
// }

/**
* Used to position a model in 3D space inline to the webpage (Maps to Model3D tag)
* Positioning behaves the same as a spatial window marked as dom space
*/
export class SpatialModelUIComponent extends SpatialComponent {
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

  /**
   * Sets the opacity of the model
   * @param opacity model opacity
   */
  async setOpacity(opacity: number) {
    await WebSpatial.updateResource(this._resource, { opacity })
  }

  // async applyAnimationToResource(animationBuilder: AnimationBuilder) {
  //   const animationDescription = animationBuilder.build();
  //   await WebSpatial.applyAnimationToResource(this._resource, animationDescription)
  // }
}
