import { UpdateSpatializedElementTransform } from './JSBCommand'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatialObject } from './SpatialObject'
import { SpatialWebEvent } from './SpatialWebEvent'
import { createSpatialEvent } from './SpatialWebEventCreator'
import {
  CubeInfo,
  SpatialDragEndEvent,
  SpatialDragEvent,
  SpatialDragStartEvent,
  SpatializedElementProperties,
  SpatialMagnifyEndEvent,
  SpatialMagnifyEvent,
  SpatialRotateEndEvent,
  SpatialRotateEvent,
  SpatialTapEvent,
} from './types/types'
import {
  CubeInfoMsg,
  ObjectDestroyMsg,
  SpatialDragEndMsg,
  SpatialDragMsg,
  SpatialDragStartMsg,
  SpatialMagnifyEndMsg,
  SpatialMagnifyMsg,
  SpatialRotateEndMsg,
  SpatialRotateMsg,
  SpatialTapMsg,
  SpatialWebMsgType,
  TransformMsg,
} from './WebMsgCommand'

/**
 * Abstract base class for all spatialized elements in the WebSpatial environment.
 * Provides common functionality for elements that can exist in 3D space,
 * including transformation handling and gesture event processing.
 */
export abstract class SpatializedElement extends SpatialObject {
  /**
   * Creates a new spatialized element with the specified ID.
   * Registers the element to receive spatial events.
   * @param id Unique identifier for this element
   */
  constructor(public readonly id: string) {
    super(id)

    SpatialWebEvent.addEventReceiver(id, this.onReceiveEvent.bind(this))
  }

  /**
   * Updates the properties of this spatialized element.
   * Must be implemented by derived classes to handle specific property updates.
   * @param properties Partial set of properties to update
   * @returns Promise resolving to the result of the update operation
   */
  abstract updateProperties(
    properties: Partial<SpatializedElementProperties>,
  ): Promise<WebSpatialProtocolResult>

  /**
   * Updates the transformation matrix of this element in 3D space.
   * This affects the position, rotation, and scale of the element.
   * @param matrix The new transformation matrix
   * @returns Promise resolving when the transform is updated
   */
  async updateTransform(matrix: DOMMatrix) {
    return new UpdateSpatializedElementTransform(this, matrix).execute()
  }

  /**
   * Information about the element's bounding cube.
   * Used for spatial calculations and hit testing.
   */
  private _cubeInfo?: CubeInfo

  /**
   * Gets the current cube information for this element.
   * @returns The current CubeInfo or undefined if not set
   */
  get cubeInfo() {
    return this._cubeInfo
  }

  /**
   * The current transformation matrix of this element.
   */
  private _transform?: DOMMatrix

  /**
   * The inverse of the current transformation matrix.
   * Used for converting world coordinates to local coordinates.
   */
  private _transformInv?: DOMMatrix

  /**
   * Gets the current transformation matrix.
   * @returns The current transformation matrix or undefined if not set
   */
  get transform() {
    return this._transform
  }

  /**
   * Gets the inverse of the current transformation matrix.
   * @returns The inverse transformation matrix or undefined if not set
   */
  get transformInv() {
    return this._transformInv
  }

  /**
   * Processes events received from the WebSpatial environment.
   * Handles various spatial events like transforms, gestures, and interactions.
   * @param data The event data received from the WebSpatial system
   */
  protected onReceiveEvent(
    data:
      | CubeInfoMsg
      | TransformMsg
      | SpatialTapMsg
      | SpatialDragStartMsg
      | SpatialDragMsg
      | SpatialDragEndMsg
      | SpatialRotateMsg
      | SpatialRotateEndMsg
      | ObjectDestroyMsg,
  ) {
    const { type } = data
    if (type === SpatialWebMsgType.objectdestroy) {
      this.isDestroyed = true
    } else if (type === SpatialWebMsgType.cubeInfo) {
      // Handle cube info updates (bounding box information)
      const cubeInfoMsg = data as CubeInfoMsg
      this._cubeInfo = new CubeInfo(cubeInfoMsg.size, cubeInfoMsg.origin)
    } else if (type === SpatialWebMsgType.transform) {
      // Handle transformation matrix updates
      this._transform = new DOMMatrix([
        data.detail.column0[0],
        data.detail.column0[1],
        data.detail.column0[2],
        0,
        data.detail.column1[0],
        data.detail.column1[1],
        data.detail.column1[2],
        0,
        data.detail.column2[0],
        data.detail.column2[1],
        data.detail.column2[2],
        0,
        data.detail.column3[0],
        data.detail.column3[1],
        data.detail.column3[2],
        1,
      ])
      this._transformInv = this._transform.inverse()
    } else if (type === SpatialWebMsgType.spatialtap) {
      // Handle tap gestures
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialtap,
        (data as SpatialTapMsg).detail,
      )
      this._onSpatialTap?.(event)
    } else if (type === SpatialWebMsgType.spatialdragstart) {
      const dragStartEvent = createSpatialEvent(
        SpatialWebMsgType.spatialdragstart,
        (data as SpatialDragStartMsg).detail,
      )
      this._onSpatialDragStart?.(dragStartEvent)
    } else if (type === SpatialWebMsgType.spatialdrag) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialdrag,
        (data as SpatialDragMsg).detail,
      )
      this._onSpatialDrag?.(event)
    } else if (type === SpatialWebMsgType.spatialdragend) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialdragend,
        (data as SpatialDragEndMsg).detail,
      )
      this._onSpatialDragEnd?.(event)
    } else if (type === SpatialWebMsgType.spatialrotate) {
      if (!this._isRotating) {
        const rotationStartEvent = createSpatialEvent(
          SpatialWebMsgType.spatialrotatestart,
          (data as SpatialRotateMsg).detail,
        )
        this._onSpatialRotateStart?.(rotationStartEvent)
      }
      this._isRotating = true
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialrotate,
        (data as SpatialRotateMsg).detail,
      )
      this._onSpatialRotate?.(event)
    } else if (type === SpatialWebMsgType.spatialrotateend) {
      this._isRotating = false
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialrotateend,
        (data as SpatialRotateEndMsg).detail,
      )
      this._onSpatialRotateEnd?.(event)
    } else if (type === SpatialWebMsgType.spatialmagnify) {
      if (!this._isMagnify) {
        const magnifyStartEvent = createSpatialEvent(
          SpatialWebMsgType.spatialmagnifystart,
          (data as SpatialMagnifyMsg).detail,
        )
        this._onSpatialMagnifyStart?.(magnifyStartEvent)
      }
      this._isMagnify = true
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialmagnify,
        (data as SpatialMagnifyMsg).detail,
      )
      this._onSpatialMagnify?.(event)
    } else if (type === SpatialWebMsgType.spatialmagnifyend) {
      this._isMagnify = false
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialmagnifyend,
        (data as SpatialMagnifyEndMsg).detail,
      )
      this._onSpatialMagnifyEnd?.(event)
    }
  }

  private _onSpatialTap?: (event: SpatialTapEvent) => void
  set onSpatialTap(value: (event: SpatialTapEvent) => void | undefined) {
    this._onSpatialTap = value
    this.updateProperties({
      enableTapGesture: value !== undefined,
    })
  }

  private _onSpatialDragStart?: (event: SpatialDragStartEvent) => void
  set onSpatialDragStart(
    value: (event: SpatialDragStartEvent) => void | undefined,
  ) {
    this._onSpatialDragStart = value
    this.updateProperties({
      enableDragStartGesture: this._onSpatialDragStart !== undefined,
    })
  }

  private _onSpatialDrag?: (event: SpatialDragEvent) => void
  set onSpatialDrag(value: (event: SpatialDragEvent) => void | undefined) {
    this._onSpatialDrag = value
    this.updateProperties({
      enableDragGesture: this._onSpatialDrag !== undefined,
    })
  }

  private _onSpatialDragEnd?: (event: SpatialDragEndEvent) => void
  set onSpatialDragEnd(
    value: ((event: SpatialDragEndEvent) => void) | undefined,
  ) {
    this._onSpatialDragEnd = value
    this.updateProperties({
      enableDragEndGesture: value !== undefined,
    })
  }

  private _isRotating = false
  private _onSpatialRotateStart?: (event: SpatialRotateEvent) => void
  set onSpatialRotateStart(
    value: ((event: SpatialRotateEvent) => void) | undefined,
  ) {
    this._onSpatialRotateStart = value
    this.updateProperties({
      enableRotateStartGesture: this._onSpatialRotateStart !== undefined,
    })
  }

  private _onSpatialRotate?: (event: SpatialRotateEvent) => void
  set onSpatialRotate(
    value: ((event: SpatialRotateEvent) => void) | undefined,
  ) {
    this._onSpatialRotate = value
    this.updateProperties({
      enableRotateGesture: this._onSpatialRotate !== undefined,
    })
  }

  private _onSpatialRotateEnd?: (event: SpatialRotateEndEvent) => void
  set onSpatialRotateEnd(
    value: ((event: SpatialRotateEndEvent) => void) | undefined,
  ) {
    this._onSpatialRotateEnd = value
    this.updateProperties({
      enableRotateEndGesture: value !== undefined,
    })
  }

  private _isMagnify = false
  private _onSpatialMagnifyStart?: (event: SpatialMagnifyEvent) => void
  set onSpatialMagnifyStart(
    value: ((event: SpatialMagnifyEvent) => void) | undefined,
  ) {
    this._onSpatialMagnifyStart = value
    this.updateProperties({
      enableMagnifyStartGesture: value !== undefined,
    })
  }

  private _onSpatialMagnify?: (event: SpatialMagnifyEvent) => void
  set onSpatialMagnify(
    value: ((event: SpatialMagnifyEvent) => void) | undefined,
  ) {
    this._onSpatialMagnify = value
    this.updateProperties({
      enableMagnifyGesture: value !== undefined,
    })
  }

  private _onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEvent) => void
  set onSpatialMagnifyEnd(
    value: ((event: SpatialMagnifyEndEvent) => void) | undefined,
  ) {
    this._onSpatialMagnifyEnd = value
    this.updateProperties({
      enableMagnifyEndGesture: value !== undefined,
    })
  }

  /**
   * Cleans up resources when this element is destroyed.
   * Removes event receivers to prevent memory leaks.
   */
  override onDestroy() {
    SpatialWebEvent.removeEventReceiver(this.id)
  }
}
