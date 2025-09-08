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
  SpatialRotationEvent,
  SpatialTapEvent,
  SpatialTransform,
} from './types/types'
import {
  CubeInfoMsg,
  SpatialDragEndMsg,
  SpatialDragMsg,
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

  async updateTransform(transform: Partial<SpatialTransform>) {
    return new UpdateSpatializedElementTransform(this, transform).execute()
  }

  private _cubeInfo?: CubeInfo
  get cubeInfo() {
    return this._cubeInfo
  }
  private onReceiveEvent = (
    data:
      | CubeInfoMsg
      | TransformMsg
      | SpatialTapMsg
      | SpatialDragMsg
      | SpatialDragEndMsg
      | SpatialRotationMsg,
  ) => {
    const { type } = data
    if (type === SpatialWebMsgType.CubeInfo) {
      const cubeInfoMsg = data as CubeInfoMsg
      this._cubeInfo = new CubeInfo(cubeInfoMsg.size, cubeInfoMsg.origin)
      console.log('SpatialWebEvent', this.id, data)
    } else if (type === SpatialWebMsgType.Transform) {
      // this.transform = data.transform
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

  override onDestroy() {
    SpatialWebEvent.removeEventReceiver(this.id)
  }

  private transform?: SpatialTransform
}
