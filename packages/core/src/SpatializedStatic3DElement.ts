import { UpdateSpatializedStatic3DElementProperties } from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedStatic3DElementProperties } from './types/types'
import { SpatialWebMsgType } from './WebMsgCommand'

export class SpatializedStatic3DElement extends SpatializedElement {
  private _readyResolve?: () => void
  private _readyReject?: () => void

  // used to cach last modelURL
  private modelURL: string = ''

  private createReadyPromise() {
    return new Promise<void>((resolve, reject) => {
      this._readyResolve = resolve
      this._readyReject = reject
    })
  }

  ready: Promise<void> = this.createReadyPromise()

  async updateProperties(
    properties: Partial<SpatializedStatic3DElementProperties>,
  ) {
    if (properties.modelURL !== undefined) {
      if (this.modelURL !== properties.modelURL) {
        this.modelURL = properties.modelURL
        this.ready = this.createReadyPromise()
      }
    }
    return new UpdateSpatializedStatic3DElementProperties(
      this,
      properties,
    ).execute()
  }

  override onReceiveEvent(data: { type: SpatialWebMsgType }) {
    if (data.type === SpatialWebMsgType.modelloaded) {
      this._onLoadCallback?.()
      this._readyResolve?.()
    } else if (data.type === SpatialWebMsgType.modelloadfailed) {
      this._onLoadFailureCallback?.()
      this._readyReject?.()
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
