import { WebSpatial } from '../private/WebSpatial'
import { SpatialComponent } from './SpatialComponent'

/**
 * Represenets a volume that can be added to the webpage
 * Child entities will be added within this volume's space
 * Defaults to having 1x1x1 meter dimensions
 * Resolution defaults to 100x100 pixels
 * Only will be displayed on entities in "ROOT" or "DOM" space
 * If the resolution of the spatial view is not a square, the volume will be larger based on the ratio with the shortest side being 1 meter.
 * (eg. 200x100 = 2m x 1m x 1m volume)
 */
export class SpatialViewComponent extends SpatialComponent {
  /**
   * Sets the resolution of the spatial view in dom pixels
   */
  async setResolution(width: number, height: number) {
    await WebSpatial.updateResource(this._resource, {
      resolution: { x: width, y: height },
    })
  }

  /**
   * Sets if content of the spatialView should be within a portal
   * If true, volume will be behind the page, if false, it will be in front of the page
   */
  async setIsPortal(isPortal: Boolean) {
    await WebSpatial.updateResource(this._resource, {
      isPortal: isPortal,
    })
  }
}
