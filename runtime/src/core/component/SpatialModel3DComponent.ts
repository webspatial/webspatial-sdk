import { EventSpatialComponent } from './EventSpatialComponent'
import { WebSpatial } from '../private/WebSpatial'
import { Vec3 } from '../SpatialTransform'

/**
 * Translate event, matching similar behavior to https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event
 */
export type ModelDragEvent = {
  eventType: 'dragstart' | 'dragend' | 'drag'
  translation3D: Vec3
  startLocation3D: Vec3
}

export type TapEvent = {
  eventType: 'tap'
}

/**
 * Used to position a model3d in 3D space
 */
export class SpatialModel3DComponent extends EventSpatialComponent {
  protected override onRecvEvent(data: any): void {
    console.log('onRecvEvent', data)
    const { eventType, value, error } = data
    switch (eventType) {
      case 'phase':
        if (value === 'success') {
          this.onSuccess?.()
        } else {
          this.onFailure?.(error as string)
        }
        break
      case 'dragstart':
        this.onDragStart?.(value)
        break
      case 'dragend':
        this.onDragEnd?.(value)
        break
      case 'drag':
        this.onDrag?.(value)
        break
      case 'tap':
        this.onTap?.()
        break
      case 'doubletap':
        this.onDoubleTap?.()
        break
      case 'longpress':
        this.onLongPress?.()
        break

      default:
        break
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
   * Callback fired when model load success
   */
  public onSuccess?: () => void

  /**
   * Callback fired when model load failure
   * @param errorReason
   */
  public onFailure?: (errorReason: string) => void

  /**
   * Callback fired when model was dragged at the beginning
   * @param dragEvent
   */
  public onDragStart?: (dragEvent: ModelDragEvent) => void

  /**
   * Callback fired when model was dragged
   * @param dragEvent
   */
  public onDrag?: (dragEvent: ModelDragEvent) => void

  /**
   * Callback fired when model was dragged at the ending
   * @param dragEvent
   */
  public onDragEnd?: (dragEvent: ModelDragEvent) => void

  /**
   * Callback fired when model was tapped
   */
  public onTap?: () => void

  /** Callback fired when model was double tapped */
  public onDoubleTap?: () => void

  /** Callback fired when model was long pressed */
  public onLongPress?: () => void
}
