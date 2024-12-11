import { SpatialObject } from './SpatialObject'
import { SpatialTransform } from './SpatialTransform'
import { SpatialWindowGroup } from './SpatialWindowGroup'
import { WebSpatial } from './private/WebSpatial'
import { SpatialComponent } from './component'

/**
 * Entity used to describe an object that can be added to the scene
 */
export class SpatialEntity extends SpatialObject {
  transform = new SpatialTransform()

  /** @hidden */
  private _destroyed = false

  private get _entity() {
    return this._resource
  }

  /**
   * Syncs the transform with the renderer, must be called to observe updates
   */
  async updateTransform() {
    await WebSpatial.updateResource(this._entity, this.transform)
  }

  /**
   * Syncs the zIndex with the renderer
   */
  async updateZIndex(zIndex: number) {
    console.log('dbg updateZIndex', zIndex)
    await WebSpatial.updateResource(this._entity, { zIndex })
  }

  private components: Map<Function, SpatialComponent> = new Map()

  /**
   * Attaches a component to the entity to be displayed
   */
  async setComponent(component: SpatialComponent) {
    await WebSpatial.setComponent(this._entity, component._resource)
    this.components.set(component.constructor, component)
  }

  async removeComponent<T extends SpatialComponent>(
    type: new (...args: any[]) => T,
  ) {
    var c = this.getComponent(type)
    if (c != undefined) {
      await WebSpatial.removeComponent(this._entity, c._resource)
      this.components.delete(c.constructor)
    }
  }

  getComponent<T extends SpatialComponent>(
    type: new (...args: any[]) => T,
  ): T | undefined {
    return this.components.get(type) as T | undefined
  }

  /**
   * Sets the windowgroup that this entity should be rendered by (this does not effect resource ownership)
   * @param wg the window group that should render this entity
   */
  async setParentWindowGroup(wg: SpatialWindowGroup) {
    await WebSpatial.updateResource(this._entity, {
      setParentWindowGroupID: wg._wg.id,
    })
  }

  /**
   * Sets a parent entity, if that entity or its parents are attached to a window group, this entity will be displayed
   * @param e parent entity or null to remove current parent
   */
  async setParent(e: SpatialEntity | null) {
    await WebSpatial.updateResource(this._entity, {
      setParent: e ? e._entity.id : '',
    })
  }

  async setCoordinateSpace(space: 'App' | 'Dom' | 'Root') {
    await WebSpatial.updateResource(this._entity, { setCoordinateSpace: space })
  }

  async getBoundingBox() {
    var res: any = await WebSpatial.updateResource(this._entity, {
      getBoundingBox: true,
    })
    return res.data as {
      center: { x: number; y: number; z: number }
      extents: { x: number; y: number; z: number }
    }
  }

  /**
   * Removes a reference to the entity by the renderer and this object should no longer be used. Attached components will not be destroyed
   */
  async destroy() {
    this._destroyed = true
    await WebSpatial.destroyResource(this._entity)
  }

  /**
   * Check if destroy has been called
   */
  isDestroyed() {
    return this._destroyed
  }
}
