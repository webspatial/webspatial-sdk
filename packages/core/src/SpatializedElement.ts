import { UpdateSpatializedElementTransform } from './JSBCommand'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatialObject } from './SpatialObject'
import { SpatialWebEvent } from './SpatialWebEvent'
import { createSpatialTapEvent } from './SpatialWebEventCreator'
import {
  CubeInfo,
  SpatializedElementProperties,
  SpatialTapEvent,
  SpatialTransform,
} from './types/types'
import {
  CubeInfoMsg,
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
    data: CubeInfoMsg | TransformMsg | SpatialTapMsg,
  ) => {
    console.log('SpatialWebEvent', this.id, data)
    if (data.type === SpatialWebMsgType.CubeInfo) {
      const cubeInfoMsg = data as CubeInfoMsg
      this._cubeInfo = new CubeInfo(cubeInfoMsg.size, cubeInfoMsg.origin)
    } else if (data.type === SpatialWebMsgType.Transform) {
      // this.transform = data.transform
    } else if (data.type === SpatialWebMsgType.spatialtap) {
      const spatialTapMsg = data as SpatialTapMsg
      const event = createSpatialTapEvent(spatialTapMsg.location3D)
      this._onSpatialTap?.(event)
    }
  }

  private _onSpatialTap?: (event: SpatialTapEvent) => void

  set onSpatialTap(value: (event: SpatialTapEvent) => void | undefined) {
    this._onSpatialTap = value
    this.updateProperties({
      enableGesture: value !== undefined,
    })
  }

  override onDestroy() {
    SpatialWebEvent.removeEventReceiver(this.id)
  }

  private transform?: SpatialTransform
}
