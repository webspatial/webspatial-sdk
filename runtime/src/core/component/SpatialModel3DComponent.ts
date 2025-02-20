import { EventSpatialComponent } from './EventSpatialComponent'
import { WebSpatial } from '../private/WebSpatial'
import { Vec3 } from '../SpatialTransform'

/**
 * Used to position a model3d in 3D space
 */
export class SpatialModel3DComponent extends EventSpatialComponent {
  protected override onRecvEvent(data: any): void {
    // console.log('onRecvEvent', data)
    const { eventType, value, error } = data
    if (eventType === 'phase') {
      if (value === 'success') {
        this.onSuccess?.()
      } else {
        this.onFailure?.(error as string)
      }
    }
  }
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

  /**
   * Sets how the model fill the rect
   * @param contentMode
   */
  async setContentMode(contentMode: 'fill' | 'fit') {
    await WebSpatial.updateResource(this._resource, {
      contentMode,
    })
  }

  /**
   * Constrains this model dimensions to the specified aspect ratio.
   * with a value of 0, the model will use the original aspect ratio.
   *
   * @param aspectRatio number
   */
  async setAspectRatio(aspectRatio: number) {
    await WebSpatial.updateResource(this._resource, {
      aspectRatio,
    })
  }

  /**
   * Sets whether the model appear in original size or fit the rect
   * @param resizable
   */
  async setResizable(resizable: boolean) {
    await WebSpatial.updateResource(this._resource, {
      resizable,
    })
  }

  /**
   * model load success callback
   */
  public onSuccess?: () => void

  /**
   * model load failure callback
   */
  public onFailure?: (errorReason: string) => void
}
