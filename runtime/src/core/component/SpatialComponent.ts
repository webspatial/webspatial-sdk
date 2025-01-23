import { WebSpatial, WebSpatialResource } from '../private/WebSpatial'
import { SpatialEntity } from '../SpatialEntity'
import { SpatialObject } from '../SpatialObject'
import { SpatialWindowGroup } from '../SpatialWindowGroup'

/** @hidden */
export class SpatialComponent extends SpatialObject {
  typeName = 'AbstractSpatialComponent'
  /**
   * Gets the entity this component is attached to
   * [TODO] should this be removed?
   * @returns entity or null
   */
  async getEntity() {
    let reqResp: any = await WebSpatial.updateResource(
      WebSpatial.getCurrentWebPanel(),
      { getEntityID: '' },
    )
    if (reqResp.data.parentID === '') {
      return new Promise<SpatialEntity | null>((res, rej) => {
        res(null)
      })
    } else {
      var res = new WebSpatialResource()
      res.id = reqResp.data.parentID
      return new SpatialEntity(res)
    }
  }

  _preprocessState(options: any) {
    return options
  }

  async setState(state: any) {
    await WebSpatial.updateResource(
      this._resource,
      this._preprocessState(state),
    )
  }

  async _createResource(wg?: SpatialWindowGroup) {
    let res = await WebSpatial.createResource(
      this.typeName,
      wg ? wg._wg : WebSpatial.getCurrentWindowGroup(),
      WebSpatial.getCurrentWebPanel(),
    )
    this._resource = res
  }
}
