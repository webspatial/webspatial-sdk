import { UpdateSpatializedStatic3DElementProperties } from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedStatic3DElementProperties } from './types/types'
import { SpatialWebMsgType } from './WebMsgCommand'

/**
 * Represents a static 3D model element in the spatial environment.
 * This class handles loading and displaying pre-built 3D models from URLs,
 * and provides events for load success and failure.
 */
export class SpatializedStatic3DElement extends SpatializedElement {
  /**
   * Promise resolver for the ready state.
   * Used to resolve the ready promise when the model is loaded.
   */
  private _readyResolve?: (success: boolean) => void

  /**
   * Caches the last model URL to detect changes.
   * Used to reset the ready promise when the model URL changes.
   */
  private modelURL: string = ''

  animationAutoplay?: boolean
  animationLoop?: boolean
  animationPaused?: boolean
  animationDuration?: number
  animationCurrentTime?: number
  animationPlaybackRate?: number

  /**
   * Creates a new promise for tracking the ready state of the model.
   * @returns Promise that resolves when the model is loaded (true) or fails to load (false)
   */
  private createReadyPromise() {
    return new Promise<boolean>(resolve => {
      this._readyResolve = resolve
    })
  }

  /**
   * Promise that resolves when the model is loaded.
   * Resolves to true on successful load, false on failure.
   */
  ready: Promise<boolean> = this.createReadyPromise()

  /**
   * Updates the properties of this static 3D element.
   * Handles special case for modelURL changes by resetting the ready promise.
   * @param properties Partial set of properties to update
   * @returns Promise resolving when the update is complete
   */
  async updateProperties(
    properties: Partial<SpatializedStatic3DElementProperties>,
  ) {
    if (properties.modelURL !== undefined) {
      if (this.modelURL !== properties.modelURL) {
        this.modelURL = properties.modelURL
        this.ready = this.createReadyPromise()
      }
    }
    if (properties.animationAutoplay !== undefined) {
      this.animationAutoplay = properties.animationAutoplay
    }
    if (properties.animationLoop !== undefined) {
      this.animationLoop = properties.animationLoop
    }
    if (properties.animationPaused !== undefined) {
      this.animationPaused = properties.animationPaused
    }
    if (properties.animationDuration !== undefined) {
      this.animationDuration = properties.animationDuration
    }
    if (properties.animationCurrentTime !== undefined) {
      this.animationCurrentTime = properties.animationCurrentTime
    }
    if (properties.animationPlaybackRate !== undefined) {
      this.animationPlaybackRate = properties.animationPlaybackRate
    }
    return new UpdateSpatializedStatic3DElementProperties(
      this,
      properties,
    ).execute()
  }

  /**
   * Processes events received from the WebSpatial environment.
   * Handles model loading events in addition to base spatial events.
   * @param data The event data received from the WebSpatial system
   */
  override onReceiveEvent(data: { type: SpatialWebMsgType }) {
    if (data.type === SpatialWebMsgType.modelloaded) {
      // Handle successful model loading
      this._onLoadCallback?.()
      this._readyResolve?.(true)
    } else if (data.type === SpatialWebMsgType.modelloadfailed) {
      // Handle model loading failure
      this._onLoadFailureCallback?.()
      this._readyResolve?.(false)
    } else {
      // Handle other spatial events using the base class implementation
      super.onReceiveEvent(data as any)
    }
  }

  /**
   * Callback function for successful model loading.
   */
  private _onLoadCallback?: () => void

  /**
   * Sets the callback function for successful model loading.
   * @param callback Function to call when the model is loaded successfully
   */
  set onLoadCallback(callback: undefined | (() => void)) {
    this._onLoadCallback = callback
  }

  /**
   * Callback function for model loading failure.
   */
  private _onLoadFailureCallback?: undefined | (() => void)

  /**
   * Sets the callback function for model loading failure.
   * @param callback Function to call when the model fails to load
   */
  set onLoadFailureCallback(callback: undefined | (() => void)) {
    this._onLoadFailureCallback = callback
  }

  updateModelTransform(transform: DOMMatrix) {
    const modelTransform = Array.from(transform.toFloat64Array())
    this.updateProperties({ modelTransform })
  }
}
