import {
  AddSpatializedElementToSpatialized2DElement,
  UpdateSpatialized2DElementProperties,
} from './JSBCommand'
import { hijackWindowATag } from './scene-polyfill'
import {
  untrackSpatialRouteObject,
  untrackSpatialRouteWindowProxy,
} from './spatial-route-cleanup'
import { SpatializedElement } from './SpatializedElement'
import { Spatialized2DElementProperties } from './types/types'

/**
 * Represents a 2D HTML element that has been spatialized in 3D space.
 * This class handles the integration between 2D web content and the 3D spatial environment,
 * allowing HTML elements to be positioned and interacted with in spatial applications.
 */
export class Spatialized2DElement extends SpatializedElement {
  /**
   * Creates a new spatialized 2D element.
   * @param id Unique identifier for this element
   * @param windowProxy Reference to the window object containing the 2D content
   */
  constructor(
    id: string,
    readonly windowProxy: WindowProxy,
  ) {
    super(id)
    // Hijack anchor tag events to handle navigation within the spatial context
    hijackWindowATag(windowProxy)
  }

  /**
   * Updates the properties of this 2D element.
   * This can include size, position, background, and other visual properties.
   * @param properties Partial set of properties to update
   * @returns Promise resolving when the update is complete
   */
  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    return new UpdateSpatialized2DElementProperties(this, properties).execute()
  }

  /**
   * Adds a child spatialized element to this 2D element.
   * This allows for creating hierarchical structures of spatial elements.
   * @param element The child element to add
   * @returns Promise resolving when the element is added
   */
  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialized2DElement(
      this,
      element,
    ).execute()
  }

  override async destroy() {
    if (this.isDestroyed) {
      return
    }

    try {
      return await super.destroy()
    } catch (error) {
      if (!this.closeWindowProxy()) {
        throw error
      }

      this.isDestroyed = true
      untrackSpatialRouteObject(this)
      untrackSpatialRouteWindowProxy(this.windowProxy)
    }
  }

  override onDestroy() {
    this.closeWindowProxy()
    super.onDestroy()
  }

  private closeWindowProxy() {
    const close = this.windowProxy?.close
    if (typeof close !== 'function') {
      return false
    }

    try {
      // 2D SpatialDivs are created through window.open(webspatial://...). In
      // WebAppTemplate the main page may not expose the JSB bridge, so closing
      // the returned window proxy is the SDK-owned fallback for releasing the
      // transferred child WebEngine.
      close.call(this.windowProxy)
      untrackSpatialRouteWindowProxy(this.windowProxy)
      return true
    } catch {
      return false
    }
  }
}
