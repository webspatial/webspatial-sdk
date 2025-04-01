import { WebSpatial } from './private/WebSpatial'
import { WebSpatialResource } from './private/WebSpatial'

/**
 * @hidden
 * Parent class of spatial objects, should not be used directly
 */
export class SpatialObject {
  /** @hidden */
  constructor(
    /** @hidden */
    public _resource: WebSpatialResource,
  ) {}

  /**
   * Marks resource to be released (it should no longer be used)
   */
  async destroy() {
    await WebSpatial.destroyResource(this._resource)
    await this.onDestroy()
  }

  public name: string = ''

  protected async onDestroy() {}
}
