import { SpatialObject } from '../../SpatialObject'
import { SpatialWebEvent } from '../../SpatialWebEvent'
import { ObjectDestroyMsg, SpatialWebMsgType } from '../../WebMsgCommand'

export class SpatialComponent extends SpatialObject {
  constructor(id: string) {
    super(id)
    SpatialWebEvent.addEventReceiver(id, this.onReceiveEvent)
  }

  private onReceiveEvent = (data: ObjectDestroyMsg) => {
    const { type } = data
    if (type === SpatialWebMsgType.objectdestroy) {
      this.isDestroyed = true
    }
  }
}
