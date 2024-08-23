import { SpatialResource } from "./SpatialResource"
import { WebSpatial } from "../webSpatialPrivate"

/**
* Used to position an iframe in 3D space
*/
export class SpatialIFrameComponent extends SpatialResource {
  /**
   * Loads a url page in the iframe
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
   * Sets if this IFrame can be used as the root element of a Plain window group. If set, this can be resized by the OS and its resolution will be set to full
   * @param makeRoot sets if this should be root or not
   */
  async setAsRoot(makeRoot: boolean) {
    await WebSpatial.updateResource(this._resource, { setRoot: makeRoot })
  }

  /**
   * Sets the resolution of the IFrame, the resulting dimensions when rendered will be equal to 1/1360 units
   * eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
   * @param x width in pixels
   * @param y height in pixels
   */
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, { resolution: { x: x, y: y } })
  }

  /**
   * Sends a message to the iframe telling it to display the content string
   * @param content Content to be displayed
   */
  async sendContent(content: string) {
    await WebSpatial.updateResource(this._resource, { sendContent: content })
  }

  /**
   * Sets the style that should be applied to the iframe
   * @param options style options
   */
  async setStyle(options: any) {
    await WebSpatial.updateResource(this._resource, { style: options })
  }

  /**
   * Enable/Disable scrolling in the iframe (defaults to enabled), if disabled, scrolling will be applied to the root page
   * @param enabled value to set
   */
  async setScrollEnabled(enabled: boolean) {
    await WebSpatial.updateResource(this._resource, { scrollEnabled: enabled })
  }

  /**
   * Sets how the iframe should be rendered. 
   * If inline, position will be relative to root webpage (0,0,0) will place the center of the iframe at the top left of the page and coordinate space will be in pixels.
   * If not inline, position will be relative to the window group origin, (0,0,0) will be the center of the window group and units will be in units of the window group (eg. meters for immersive window group)
   * @param isInline value to set
   */
  async setInline(isInline: boolean) {
    await WebSpatial.updateResource(this._resource, { inline: isInline })
  }

  /**
   * Defaults to false. If set to true, scrolling the parent page will also scroll this window with it like other dom elements
   * @param scrollWithParent value to set
   */
  async setScrollWithParent(scrollWithParent: boolean) {
    await WebSpatial.updateResource(this._resource, { scrollWithParent: scrollWithParent })
  }
}
