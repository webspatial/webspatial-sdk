import { EventSpatialComponent } from './EventSpatialComponent'
import { WebSpatial } from '../private/WebSpatial'
import { Vec3 } from '../SpatialTransform'

/**
 * Translate event, matching similar behavior to https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event
 */
export type SpatialModelDragEvent = {
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
        this._onDragStart?.(value)
        break
      case 'dragend':
        this._onDragEnd?.(value)
        break
      case 'drag':
        this._onDrag?.(value)
        break
      case 'tap':
        this._onTap?.()
        break
      case 'doubletap':
        this._onDoubleTap?.()
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
  async setResolution(width: number, height: number) {
    await WebSpatial.updateResource(this._resource, {
      resolution: { x: width, y: height },
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
   * Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements
   * @param scrollWithParent value to set
   */
  async setScrollWithParent(scrollWithParent: boolean) {
    await WebSpatial.updateResource(this._resource, {
      scrollWithParent: scrollWithParent,
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
  private _onDragStart?: (dragEvent: SpatialModelDragEvent) => void
  public set onDragStart(
    callback: ((dragEvent: SpatialModelDragEvent) => void) | undefined,
  ) {
    if (this._onDragStart !== callback) {
      this._onDragStart = callback
      WebSpatial.updateResource(this._resource, {
        enableDragEvent: this.enableDragEvent,
      })
    }
  }

  /**
   * Callback fired when model was dragged
   * @param dragEvent
   */
  private _onDrag?: (dragEvent: SpatialModelDragEvent) => void
  public set onDrag(
    callback: ((dragEvent: SpatialModelDragEvent) => void) | undefined,
  ) {
    if (this._onDrag !== callback) {
      this._onDrag = callback
      WebSpatial.updateResource(this._resource, {
        enableDragEvent: this.enableDragEvent,
      })
    }
  }

  /**
   * Callback fired when model was dragged at the ending
   * @param dragEvent
   */
  private _onDragEnd?: (dragEvent: SpatialModelDragEvent) => void
  public set onDragEnd(
    callback: ((dragEvent: SpatialModelDragEvent) => void) | undefined,
  ) {
    if (this._onDragEnd !== callback) {
      this._onDragEnd = callback
      WebSpatial.updateResource(this._resource, {
        enableDragEvent: this.enableDragEvent,
      })
    }
  }

  private get enableDragEvent(): boolean {
    return (
      undefined !== this._onDrag ||
      undefined !== this._onDragStart ||
      undefined !== this._onDragEnd
    )
  }

  /**
   * Callback fired when model was tapped
   */
  private _onTap?: () => void
  public set onTap(callback: (() => void) | undefined) {
    if (this._onTap !== callback) {
      this._onTap = callback
      WebSpatial.updateResource(this._resource, {
        enableTapEvent: undefined !== callback,
      })
    }
  }

  /** Callback fired when model was double tapped */
  private _onDoubleTap?: () => void
  public set onDoubleTap(callback: (() => void) | undefined) {
    if (this._onDoubleTap !== callback) {
      this._onDoubleTap = callback
      WebSpatial.updateResource(this._resource, {
        enableDoubleTapEvent: undefined !== callback,
      })
    }
  }

  /** Callback fired when model was long pressed */
  private _onLongPress?: () => void
  public set onLongPress(callback: (() => void) | undefined) {
    if (this._onLongPress !== callback) {
      this._onLongPress = callback
      WebSpatial.updateResource(this._resource, {
        enableLongPressEvent: undefined !== callback,
      })
    }
  }
}
