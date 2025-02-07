import {
  WebSpatial,
  WebSpatialResource,
  WindowGroup,
} from './private/WebSpatial'
import { SpatialEntity } from './SpatialEntity'

/**
 * Anchored window managed by the OS
 */
export class SpatialWindowGroup {
  /** @hidden */
  constructor(
    /** @hidden */
    public _wg: WindowGroup,
  ) {}
  /**
   * @hidden
   * Sets sets the open configuration for opening new window groups
   * @param options style options
   */
  async _setOpenSettings(options: { dimensions: { x: number; y: number } }) {
    await WebSpatial.updateWindowGroup(this._wg, { nextOpenSettings: options })
  }

  /**
   * Retrieves the root entity of the windowGroup
   * @returns the root entity of the windowGroup if one exists
   */
  async getRootEntity() {
    let reqResp: any = await WebSpatial.updateWindowGroup(this._wg, {
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
}
