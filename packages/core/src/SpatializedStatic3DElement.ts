import { UpdateSpatializedStatic3DElementProperties } from './JSBCommand'
import { ReceiveEventData, SpatializedElement } from './SpatializedElement'
import {
  ModelSource,
  SpatializedStatic3DElementProperties,
} from './types/types'
import {
  ModelLoadSuccess,
  ModelLoadFailure,
  SpatialWebMsgType,
  AnimationStateChangeDetail,
  AnimationStateChangeMsg,
} from './WebMsgCommand'

/**
 * Represents a static 3D model element in the spatial environment.
 * This class handles loading and displaying pre-built 3D models from URLs,
 * and provides events for load success and failure.
 */
export class SpatializedStatic3DElement extends SpatializedElement {
  /**
   * Creates a new spatialized static 3D element with the specified ID and URL.
   * Registers the element to receive spatial events.
   * @param id Unique identifier for this element
   * @param modelURL URL of the 3D model
   * @param sources Optional fallback model sources
   */
  constructor(id: string, modelURL?: string, sources?: ModelSource[]) {
    super(id)
    this.modelURL = modelURL
    this.sources = sources
  }

  /**
   * Promise resolver for the ready state.
   * Used to resolve the ready promise when the model is loaded.
   */
  private _readyResolve?: (success: boolean) => void

  /**
   * Caches the last model URL to detect changes.
   * Used to reset the ready promise when the model URL changes.
   */
  private modelURL?: string

  /**
   * Caches the last sources array to detect changes.
   */
  private sources?: ModelSource[]

  /**
   * The model URL that was successfully loaded by the native runtime.
   */
  private _currentSrc: string = ''

  get currentSrc(): string {
    return this._currentSrc
  }

  /**
   * Creates a new promise for tracking the ready state of the model.
   * @returns Promise that resolves when the model is loaded (true) or fails to load (false)
   */
  private createReadyPromise() {
    // If there's an existing promise reject it before it's replaced
    this._readyResolve?.(false)
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
    let needsReadyReset = false
    if (properties.modelURL !== undefined) {
      if (this.modelURL !== properties.modelURL) {
        this.modelURL = properties.modelURL
        needsReadyReset = true
      }
    }
    if (properties.sources !== undefined) {
      const prevJson = JSON.stringify(this.sources)
      const nextJson = JSON.stringify(properties.sources)
      if (prevJson !== nextJson) {
        this.sources = properties.sources
        needsReadyReset = true
      }
    }
    if (needsReadyReset) {
      this.ready = this.createReadyPromise()
    }
    if (properties.autoplay !== undefined) {
      this._autoplay = properties.autoplay
    }
    if (properties.loop !== undefined) {
      this._loop = properties.loop
    }
    if (properties.playbackRate !== undefined) {
      this._playbackRate = properties.playbackRate
    }
    return new UpdateSpatializedStatic3DElementProperties(
      this,
      properties,
    ).execute()
  }

  /**
   * Total animation duration in seconds, synced from native.
   */
  private _duration: number = 0

  /**
   * Returns the total animation duration in seconds.
   */
  get duration(): number {
    return this._duration
  }

  /**
   * Playback speed multiplier.
   */
  private _playbackRate: number = 1

  /**
   * Returns the current playback rate.
   */
  get playbackRate(): number {
    return this._playbackRate
  }

  /**
   * Sets the playback rate and sends it to native.
   */
  set playbackRate(value: number) {
    this.updateProperties({ playbackRate: value })
  }

  /**
   * Whether the animation is currently paused.
   */
  private _paused: boolean = true

  /**
   * Returns whether the animation is currently paused.
   */
  get paused(): boolean {
    return this._paused
  }

  /**
   * Callback for animation state changes.
   */
  private _onAnimationStateChangeCallback?: (
    detail: AnimationStateChangeDetail,
  ) => void

  /**
   * Sets the callback for animation state changes.
   */
  set onAnimationStateChangeCallback(
    callback: undefined | ((detail: AnimationStateChangeDetail) => void),
  ) {
    this._onAnimationStateChangeCallback = callback
  }

  /**
   * Starts or resumes animation playback.
   * @returns Promise resolving when the command is sent
   */
  async play(): Promise<void> {
    this._paused = false
    await this.updateProperties({ animationPaused: false })
  }

  /**
   * Pauses animation playback.
   * @returns Promise resolving when the command is sent
   */
  async pause(): Promise<void> {
    this._paused = true
    await this.updateProperties({ animationPaused: true })
  }

  /**
   * Processes events received from the WebSpatial environment.
   * Handles model loading events in addition to base spatial events.
   * @param data The event data received from the WebSpatial system
   */
  override onReceiveEvent(data: Static3DReceiveEventData) {
    if (data.type === SpatialWebMsgType.modelloaded) {
      // On old runtimes (<⍺2.1) detail is not returned so fallback to modelURL
      this._currentSrc = data.detail?.src ?? this.modelURL ?? ''
      // Handle successful model loading
      this._onLoadCallback?.()
      this._readyResolve?.(true)
    } else if (data.type === SpatialWebMsgType.modelloadfailed) {
      // Handle model loading failure
      this._onLoadFailureCallback?.()
      this._readyResolve?.(false)
    } else if (data.type === SpatialWebMsgType.animationstatechange) {
      this._paused = data.detail.paused
      this._duration = data.detail.duration
      this._onAnimationStateChangeCallback?.(data.detail)
    } else {
      // Handle other spatial events using the base class implementation
      super.onReceiveEvent(data)
    }
  }

  /**
   * Whether the model should automatically play its first animation on load.
   */
  private _autoplay: boolean = false

  /**
   * Returns whether autoplay is enabled for this element.
   */
  get autoplay(): boolean {
    return this._autoplay
  }

  /**
   * Whether the model animation should loop continuously.
   */
  private _loop: boolean = false

  /**
   * Returns whether loop is enabled for this element.
   */
  get loop(): boolean {
    return this._loop
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

  updateModelTransform(transform: DOMMatrixReadOnly) {
    const modelTransform = Array.from(transform.toFloat64Array())
    this.updateProperties({ modelTransform })
  }
}

type Static3DReceiveEventData =
  | ModelLoadSuccess
  | ModelLoadFailure
  | ReceiveEventData
  | AnimationStateChangeMsg
