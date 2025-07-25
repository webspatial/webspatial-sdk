/**
 * @hidden
 * Parent class of spatial objects, should not be used directly
 */
export class SpatialObject {
  /** @hidden */
  constructor(
    /** @hidden */
    public readonly id: string,
  ) {}

  /**
   * Marks resource to be released (it should no longer be used)
   */
  async destroy() {}
}
