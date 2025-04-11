import {
  WebSpatial,
  WebSpatialResource,
  WindowContainer,
} from './private/WebSpatial'
import { SpatialEntity } from './SpatialEntity'

/**
 * Anchored window managed by the OS
 */
export class SpatialWindowContainer {
  /** @hidden */
  constructor(
    /** @hidden */
    public _wg: WindowContainer,
  ) {}
  /**
   * @hidden
   * Sets sets the open configuration for opening new window containers
   * @param options style options
   */
  async _setOpenSettings(options: {
    resolution: { width: number; height: number }
  }) {
    await WebSpatial.updateWindowContainer(this._wg, {
      nextOpenSettings: options,
    })
  }

  /**
   * Retrieves the root entity of the windowContainer
   * @returns the root entity of the windowContainer if one exists
   */
  async getRootEntity() {
    let reqResp: any = await WebSpatial.updateWindowContainer(this._wg, {
      getRootEntityID: '',
    })
    if (reqResp.data.rootEntId === '') {
      return null
    } else {
      var res = new WebSpatialResource()
      res.id = reqResp.data.rootEntId
      return new SpatialEntity(res)
    }
  }
  /*
   * Sets the root entity that this windowContainer will display (this does not effect resource ownership)
   * @param entity to display
   */
  async setRootEntity(entity: SpatialEntity) {
    await entity._setParentWindowContainer(this)
  }

  async close() {
    await WebSpatial.updateWindowContainer(this._wg, {
      close: true,
    })
  }
}
