import { WebSpatial, WebSpatialResource } from '../private/WebSpatial'
import { SpatialComponent } from './SpatialComponent'

/**
 * @description
 * Represents a spatial component that handles events related to spatial interactions.
 * This class extends `SpatialComponent` and provides additional functionality for managing
 * event-driven spatial behaviors.
 *
 * @hidden
 * This class is intended for internal use and should not be exposed in the public API.
 */
export abstract class EventSpatialComponent extends SpatialComponent {
  // Class implementation goes here
  constructor(_resource: WebSpatialResource) {
    super(_resource)
    WebSpatial.registerEventReceiver(_resource.id, (data: any) => {
      this.onRecvEvent(data)
    })
  }

  /**
   * @description
   * Abstract method to be implemented by subclasses. Called when a spatial event is received.
   * @param data The data associated with the received event.
   */
  protected abstract onRecvEvent(data: any): void

  protected override async onDestroy() {
    WebSpatial.unregisterEventReceiver(this._resource.id)
  }
}
