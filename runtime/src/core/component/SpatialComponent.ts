import { WebSpatial, WebSpatialResource } from "../private/WebSpatial"
import { SpatialEntity } from "../SpatialEntity"
import { SpatialObject } from "../SpatialObject"
export class SpatialComponent extends SpatialObject {
    async getEntity() {
        let reqResp: any = await WebSpatial.updateResource(WebSpatial.getCurrentWebPanel(), { getEntityID: "" })
        if (reqResp.data.parentID === "") {
            return new Promise<SpatialEntity | null>((res, rej) => { res(null) })
        } else {
            var res = new WebSpatialResource()
            res.id = reqResp.data.parentID
            return new SpatialEntity(res)
        }
    }
}
