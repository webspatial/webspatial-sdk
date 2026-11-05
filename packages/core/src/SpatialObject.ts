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

  name?: string

  isDestroyed = false

  private pendingDestroy: Promise<any> | undefined

  async inspect() {
    const ret = await new InspectCommand(this.id).execute()
    if (ret.success) {
      return ret.data
    }
    throw new Error(ret.errorMessage)
  }

  async destroy() {
    if (this.pendingDestroy) {
      return this.pendingDestroy
    }
    if (this.isDestroyed) {
      return
    }

    this.pendingDestroy = this.destroyNativeObject()
    try {
      return await this.pendingDestroy
    } finally {
      this.pendingDestroy = undefined
    }
  }

  private async destroyNativeObject() {
    const ret = await new DestroyCommand(this.id).execute()
    if (ret.success) {
      this.onDestroy()
      this.isDestroyed = true
      return ret.data
    } else if (this.isDestroyed) {
      // already destroyed
      return
    }

    const errorMessage =
      typeof ret.errorMessage === 'string' ? ret.errorMessage.toLowerCase() : ''
    const isMissingNativeObject = errorMessage.includes('not exsit')
    if (isMissingNativeObject) {
      // Treat native pre-teardown as an idempotent destroy during page back navigation.
      this.onDestroy()
      this.isDestroyed = true
      return
    }

    throw new Error(ret.errorMessage)
  }

  // override this method to do some cleanup
  protected onDestroy() {}
}
