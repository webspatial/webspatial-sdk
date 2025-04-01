import { SpatialObject } from './SpatialObject'
import { SpatialTransform } from './SpatialTransform'
import { SpatialWindowContainer } from './SpatialWindowContainer'
import { WebSpatial } from './private/WebSpatial'
import { SpatialComponent } from './component'

/**
 * Entity used to describe an object that can be added to the scene
 */
export class SpatialEntity extends SpatialObject {
  /**
   * Transform corresponding to the entity
   * note: updateTransform must be called for transform to be synced to rendering
   */
  transform = new SpatialTransform()

  /** @hidden */
  private _destroyed = false
  /** @hidden */
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
    await WebSpatial.updateResource(this._entity, { zIndex })
  }

  private components: Map<Function, SpatialComponent> = new Map()

  /**
   * Attaches a component to the entity to be displayed
   * [TODO] review pass by value vs ref and ownership model for this
   */
  async setComponent(component: SpatialComponent) {
    await WebSpatial.setComponent(this._entity, component._resource)
    this.components.set(component.constructor, component)
  }

  /**
   * Removes a component from the entity
   */
  async removeComponent<T extends SpatialComponent>(
    type: new (...args: any[]) => T,
  ) {
    var c = this.getComponent(type)
    if (c != undefined) {
      await WebSpatial.removeComponent(this._entity, c._resource)
      this.components.delete(c.constructor)
    }
  }

  /**
   * Gets a component from the entity
   */
  getComponent<T extends SpatialComponent>(
    type: new (...args: any[]) => T,
  ): T | undefined {
    return this.components.get(type) as T | undefined
  }

  /**
   * @hidden
   * Sets the window container that this entity should be rendered by (this does not effect resource ownership)
   * @param wg the window container that should render this entity
   */
  async _setParentWindowContainer(wg: SpatialWindowContainer) {
    await WebSpatial.updateResource(this._entity, {
      setParentWindowContainerID: wg._wg.id,
    })
  }

  /**
   * Sets a parent entity, if that entity or its parents are attached to a window container, this entity will be displayed
   * @param e parent entity or null to remove current parent
   */
  async setParent(e: SpatialEntity | null) {
    await WebSpatial.updateResource(this._entity, {
      setParent: e ? e._entity.id : '',
    })
  }

  /**
   * Sets the coordinate space of this entity (Default: App)
   * "App" = game engine style coordinates in meters
   * "Dom" = Windowing coordinates in dom units (eg. 0,0,0 is top left of window)
   * "Root" = Coordinate space is ignored and content is displayed and updated as window container's root object, window containers can only have one root entity
   * [TODO] review this api
   * @param space coordinate space mode
   */
  async setCoordinateSpace(space: 'App' | 'Dom' | 'Root') {
    await WebSpatial.updateResource(this._entity, { setCoordinateSpace: space })
  }

  /**
   * Query the 3d boudning box of the entity
   * @returns The bounding box of the entity
   */
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
   * Sets if the entity should be visible (default: True)
   * @param visible
   */
  async setVisible(visible: boolean) {
    await WebSpatial.updateResource(this._entity, { visible })
  }

  /**
   * Removes a reference to the entity by the renderer and this object should no longer be used. [TODO] Attached components will not be destroyed
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

  // Set Entity name. Currently for debugging only.
  /** @hidden */
  async _setName(name: string) {
    this.name = name
    return WebSpatial.updateResource(this._entity, { name })
  }
}
