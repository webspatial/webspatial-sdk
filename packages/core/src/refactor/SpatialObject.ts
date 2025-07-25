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

  async destroy() {}
}
