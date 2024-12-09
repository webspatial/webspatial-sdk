import { WebSpatial, WindowGroup } from './private/WebSpatial'

export class SpatialWindowGroup {
  /** @hidden */
  constructor(
    /** @hidden */
    public _wg: WindowGroup,
  ) {}

  /**
   * Sets the style that should be applied to the windowGroup
   * @param options style options
   */
  async setStyle(options: any) {
    await WebSpatial.updateWindowGroup(this._wg, { style: options })
  }
}
