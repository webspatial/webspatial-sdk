import { UpdateSpatializedElementTransform } from './JSBCommand'
import { WebSpatialProtocolResult } from './platform-adapter/interface'
import { SpatialObject } from './SpatialObject'
import { SpatialWebEvent } from './SpatialWebEvent'
import {
  CubeInfo,
  SpatializedElementProperties,
  SpatialTransform,
} from './types/types'
import { CubeInfoMsg, SpatialWebMsgType, TransformMsg } from './WebMsgCommand'

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
  private onReceiveEvent = (data: CubeInfoMsg | TransformMsg) => {
    console.log('SpatialWebEvent', this.id, data)
    if (data.type === SpatialWebMsgType.CubeInfo) {
      const cubeInfoMsg = data as CubeInfoMsg
      this._cubeInfo = new CubeInfo(cubeInfoMsg.size, cubeInfoMsg.origin)
    } else if (data.type === SpatialWebMsgType.Transform) {
      // this.transform = data.transform
    }
  }

  override onDestroy() {
    SpatialWebEvent.removeEventReceiver(this.id)
  }

  private transform?: SpatialTransform
}
