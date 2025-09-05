import { DestroyCommand, InspectCommand } from './JSBCommand'

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

  async inspect() {
    const ret = await new InspectCommand(this.id).execute()
    if (ret.success) {
      return ret.data
    }
    throw new Error(ret.errorMessage)
  }

  async destroy() {
    const ret = await new DestroyCommand(this.id).execute()
    if (ret.success) {
      this.onDestroy()
      return ret.data
    }
    // throw new Error(ret.errorMessage)
  }

  // override this method to do some cleanup
  protected onDestroy() {}
}
