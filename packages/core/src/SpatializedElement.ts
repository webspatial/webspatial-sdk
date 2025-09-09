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
  SpatialRotationEndEvent,
  SpatialRotationEvent,
  SpatialTapEvent,
  SpatialTransform,
} from './types/types'
import {
  CubeInfoMsg,
  SpatialDragEndMsg,
  SpatialDragMsg,
  SpatialMagnifyEndMsg,
  SpatialMagnifyMsg,
  SpatialRotationEndMsg,
  SpatialRotationMsg,
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
      | SpatialRotationMsg
      | SpatialRotationEndMsg,
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
    } else if (type === SpatialWebMsgType.spatialrotation) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialrotation,
        (data as SpatialRotationMsg).detail,
      )
      this._onSpatialRotation?.(event)
    } else if (type === SpatialWebMsgType.spatialrotationend) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialrotationend,
        (data as SpatialRotationEndMsg).detail,
      )
      this._onSpatialRotationEnd?.(event)
    } else if (type === SpatialWebMsgType.spatialmagnify) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialmagnify,
        (data as SpatialMagnifyMsg).detail,
      )
      this._onSpatialMagnify?.(event)
    } else if (type === SpatialWebMsgType.spatialmagnifyend) {
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

  private _onSpatialDrag?: (event: SpatialDragEvent) => void
  set onSpatialDrag(value: (event: SpatialDragEvent) => void | undefined) {
    this._onSpatialDrag = value
    this.updateProperties({
      enableDragGesture: value !== undefined,
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

  private _onSpatialRotation?: (event: SpatialRotationEvent) => void
  set onSpatialRotation(
    value: ((event: SpatialRotationEvent) => void) | undefined,
  ) {
    this._onSpatialRotation = value
    this.updateProperties({
      enableRotationGesture: value !== undefined,
    })
  }

  private _onSpatialRotationEnd?: (event: SpatialRotationEndEvent) => void
  set onSpatialRotationEnd(
    value: ((event: SpatialRotationEndEvent) => void) | undefined,
  ) {
    this._onSpatialRotationEnd = value
    this.updateProperties({
      enableRotateEndGesture: value !== undefined,
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
