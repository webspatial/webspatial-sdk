import { SpatialResource } from "./SpatialResource"
import { WebSpatial } from "../webSpatialPrivate"

/**
* Used to position an web window in 3D space
*/
export class SpatialWindowComponent extends SpatialResource {
  /**
   * Loads a url page in the window
   * @param url url to load
   */
  async loadURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }

  async setFromWindow(window: any) {
    if (window._webSpatialID) {
      await WebSpatial.updateResource(this._resource, { windowID: window._webSpatialID })
    } else {
      await WebSpatial.logger.error("failed to call setFromWindow, window provided is not valid")
    }
  }

  /**
   * Sets the resolution of the window, the resulting dimensions when rendered will be equal to 1/1360 units
   * eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
   * @param x width in pixels
   * @param y height in pixels
   */
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }

  /**
   * Sets the style that should be applied to the window
   * @param options style options
   */
  async setStyle(options: any) {
    await WebSpatial.updateResource(this._resource, { style: options })
  }

  /**
   * Modifies the amount the spatial window can be scrolled
   * Should only be used internally
   * See https://developer.apple.com/documentation/uikit/1624475-uiedgeinsetsmake?language=objc
   * @param insets margin to modify scroll distances by
   */
  async setScrollEdgeInsets(insets: { top: number, left: number, bottom: number, right: number }) {
    await WebSpatial.updateResource(this._resource, { setScrollEdgeInsets: insets })
  }

  /**
   * Enable/Disable scrolling in the window (defaults to enabled), if disabled, scrolling will be applied to the root page
   * @param enabled value to set
   */
  async setScrollEnabled(enabled: boolean) {
    await WebSpatial.updateResource(this._resource, { scrollEnabled: enabled })
  }

  /**
   * Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements
   * @param scrollWithParent value to set
   */
  async setScrollWithParent(scrollWithParent: boolean) {
    await WebSpatial.updateResource(this._resource, { scrollWithParent: scrollWithParent })
  }
}
