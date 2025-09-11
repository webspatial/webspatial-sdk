import { UpdateSpatializedStatic3DElementProperties } from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedStatic3DElementProperties } from './types/types'
import { SpatialWebMsgType } from './WebMsgCommand'

export class SpatializedStatic3DElement extends SpatializedElement {
  async updateProperties(
    properties: Partial<SpatializedStatic3DElementProperties>,
  ) {
    return new UpdateSpatializedStatic3DElementProperties(
      this,
      properties,
    ).execute()
  }

  override onReceiveEvent(data: { type: SpatialWebMsgType }) {
    if (data.type === SpatialWebMsgType.modelloaded) {
      this._onLoadCallback?.()
    } else if (data.type === SpatialWebMsgType.modelloadfailed) {
      this._onLoadFailureCallback?.()
    } else {
      super.onReceiveEvent(data as any)
    }
  }

  private _onLoadCallback?: () => void
  set onLoadCallback(callback: undefined | (() => void)) {
    this._onLoadCallback = callback
  }

  private _onLoadFailureCallback?: undefined | (() => void)
  set onLoadFailureCallback(callback: undefined | (() => void)) {
    this._onLoadFailureCallback = callback
  }
}
