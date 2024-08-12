import { SpatialResource } from "./SpatialResource/SpatialResource"
import { SpatialTransform } from "./SpatialTransform"
import { SpatialWindowGroup } from "./SpatialWindowGroup"
import { WebSpatial, WebSpatialResource } from './webSpatialPrivate'

/**
 * Entity used to describe an object that can be added to the scene
 */
export class SpatialEntity {
    transform = new SpatialTransform()
  
    /** @hidden */
    private _destroyed = false
    /** @hidden */
    constructor(
      /** @hidden */
      public _entity: WebSpatialResource
    ) {
  
    }
  
    /**
     * Syncs the transform with the renderer, must be called to observe updates
     */
    async updateTransform() {
      await WebSpatial.updateResource(this._entity, this.transform)
    }
  
    /**
    * Attaches a component to the entity to be displayed
    */
    async setComponent(component: SpatialResource) {
      await WebSpatial.setComponent(this._entity, component._resource)
    }
  
    /**
     * Sets the windowgroup that this entity should be rendered by (this does not effect resource ownership)
     * @param wg the window group that should render this entity
     */
    async setParentWindowGroup(wg: SpatialWindowGroup) {
      await WebSpatial.updateResource(this._entity, { setParentWindowGroupID: wg._wg.id })
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
  