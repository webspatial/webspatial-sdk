import { WebSpatial } from "../webSpatialPrivate";
import { WebSpatialResource } from "../webSpatialPrivate";

export class SpatialResource {
    /** @hidden */
    constructor(
      /** @hidden */
      public _resource: WebSpatialResource
    ) {
    }
  
    /**
     * Marks resource to be released (it should no longer be used)
     */
    async destroy() {
      await WebSpatial.destroyResource(this._resource)
    }
  }
  