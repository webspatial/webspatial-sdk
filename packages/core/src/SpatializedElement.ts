import { UpdateSpatializedElementTransform } from './JSBCommand'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatialObject } from './SpatialObject'
import { SpatialWebEvent } from './SpatialWebEvent'
import { createSpatialEvent } from './SpatialWebEventCreator'
import {
  CubeInfo,
  SpatialDragEndEvent,
  SpatialDragEvent,
  SpatializedElementProperties,
  SpatialMagnifyEndEvent,
  SpatialMagnifyEvent,
  SpatialRotateEndEvent,
  SpatialRotateEvent,
  SpatialTapEvent,
} from './types/types'
import {
  CubeInfoMsg,
  SpatialDragEndMsg,
  SpatialDragMsg,
  SpatialMagnifyEndMsg,
  SpatialMagnifyMsg,
  SpatialRotateEndMsg,
  SpatialRotateMsg,
  SpatialTapMsg,
  SpatialWebMsgType,
  TransformMsg,
} from './WebMsgCommand'

export abstract class SpatializedElement extends SpatialObject {
  constructor(public readonly id: string) {
    super(id)

    SpatialWebEvent.addEventReceiver(id, this.onReceiveEvent)
  }
  abstract updateProperties(
    properties: Partial<SpatializedElementProperties>,
  ): Promise<WebSpatialProtocolResult>

  async updateTransform(matrix: DOMMatrix) {
    return new UpdateSpatializedElementTransform(this, matrix).execute()
  }

  private _cubeInfo?: CubeInfo
  get cubeInfo() {
    return this._cubeInfo
  }

  private _transform?: DOMMatrix
  private _transformInv?: DOMMatrix
  get transform() {
    return this._transform
  }
  get transformInv() {
    return this._transformInv
  }

  private onReceiveEvent = (
    data:
      | CubeInfoMsg
      | TransformMsg
      | SpatialTapMsg
      | SpatialDragMsg
      | SpatialDragEndMsg
      | SpatialRotateMsg
      | SpatialRotateEndMsg,
  ) => {
    const { type } = data
    if (type === SpatialWebMsgType.cubeInfo) {
      const cubeInfoMsg = data as CubeInfoMsg
      this._cubeInfo = new CubeInfo(cubeInfoMsg.size, cubeInfoMsg.origin)
    } else if (type === SpatialWebMsgType.transform) {
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
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialtap,
        (data as SpatialTapMsg).detail,
      )
      this._onSpatialTap?.(event)
    } else if (type === SpatialWebMsgType.spatialdrag) {
      if (!this._isDragging) {
        const dragStartEvent = createSpatialEvent(
          SpatialWebMsgType.spatialdragstart,
          (data as SpatialDragMsg).detail,
        )
        this._onSpatialDragStart?.(dragStartEvent)
      }
      this._isDragging = true
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialdrag,
        (data as SpatialDragMsg).detail,
      )
      this._onSpatialDrag?.(event)
    } else if (type === SpatialWebMsgType.spatialdragend) {
      this._isDragging = false
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

  private _isDragging = false
  private _onSpatialDragStart?: (event: SpatialDragEvent) => void
  set onSpatialDragStart(value: (event: SpatialDragEvent) => void | undefined) {
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

  override onDestroy() {
    SpatialWebEvent.removeEventReceiver(this.id)
  }
}
