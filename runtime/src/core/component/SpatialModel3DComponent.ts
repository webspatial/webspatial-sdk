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
        this._onLongPress?.()
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
  private _onDragStart?: (dragEvent: ModelDragEvent) => void
  public set onDragStart(
    callback: ((dragEvent: ModelDragEvent) => void) | undefined,
  ) {
    if (this._onDragStart !== callback) {
      this._onDragStart = callback
      WebSpatial.updateResource(this._resource, {
        enableDrag: this.enableDragEvent,
      })
    }
  }

  /**
   * Callback fired when model was dragged
   * @param dragEvent
   */
  private _onDrag?: (dragEvent: ModelDragEvent) => void
  public set onDrag(
    callback: ((dragEvent: ModelDragEvent) => void) | undefined,
  ) {
    if (this._onDrag !== callback) {
      this._onDrag = callback
      WebSpatial.updateResource(this._resource, {
        enableDrag: this.enableDragEvent,
      })
    }
  }

  /**
   * Callback fired when model was dragged at the ending
   * @param dragEvent
   */
  private _onDragEnd?: (dragEvent: ModelDragEvent) => void
  public set onDragEnd(
    callback: ((dragEvent: ModelDragEvent) => void) | undefined,
  ) {
    if (this._onDragEnd !== callback) {
      this._onDragEnd = callback
      WebSpatial.updateResource(this._resource, {
        enableDrag: this.enableDragEvent,
      })
    }
  }

  private get enableDragEvent(): boolean {
    return undefined !== this._onDrag || undefined !== this._onDragStart
  }

  /**
   * Callback fired when model was tapped
   */
  private _onTap?: () => void
  public set onTap(callback: (() => void) | undefined) {
    if (this._onTap !== callback) {
      this._onTap = callback
      WebSpatial.updateResource(this._resource, {
        enableTap: undefined !== callback,
      })
    }
  }

  /** Callback fired when model was double tapped */
  private _onDoubleTap?: () => void
  public set onDoubleTap(callback: (() => void) | undefined) {
    if (this._onDoubleTap !== callback) {
      this._onDoubleTap = callback
      WebSpatial.updateResource(this._resource, {
        enableDoubleTap: undefined !== callback,
      })
    }
  }

  /** Callback fired when model was long pressed */
  private _onLongPress?: () => void
  public set onLongPress(callback: (() => void) | undefined) {
    if (this._onLongPress !== callback) {
      this._onLongPress = callback
      WebSpatial.updateResource(this._resource, {
        enableLongPress: undefined !== callback,
      })
    }
  }
}
