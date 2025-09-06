import { UpdateSpatializedElementTransform } from './JSBCommand'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatialObject } from './SpatialObject'
import { SpatialWebEvent } from './SpatialWebEvent'
import { createSpatialEvent } from './SpatialWebEventCreator'
import {
  CubeInfo,
  SpatialDragEvent,
  SpatialDragEventDetail,
  SpatializedElementProperties,
  SpatialTapEvent,
  SpatialTapEventDetail,
  SpatialTransform,
} from './types/types'
import {
  CubeInfoMsg,
  SpatialDragMsg,
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
    data: CubeInfoMsg | TransformMsg | SpatialTapMsg | SpatialDragMsg,
  ) => {
    console.log('SpatialWebEvent', this.id, data)
    const { type, ...detail } = data
    if (type === SpatialWebMsgType.CubeInfo) {
      const cubeInfoMsg = data as CubeInfoMsg
      this._cubeInfo = new CubeInfo(cubeInfoMsg.size, cubeInfoMsg.origin)
    } else if (type === SpatialWebMsgType.Transform) {
      // this.transform = data.transform
    } else if (type === SpatialWebMsgType.spatialtap) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialtap,
        detail as SpatialTapEventDetail,
      )
      this._onSpatialTap?.(event)
    } else if (type === SpatialWebMsgType.spatialdrag) {
      const event = createSpatialEvent(
        SpatialWebMsgType.spatialdrag,
        detail as SpatialDragEventDetail,
      )
      this._onSpatialDrag?.(event)
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

  override onDestroy() {
    SpatialWebEvent.removeEventReceiver(this.id)
  }

  private transform?: SpatialTransform
}
