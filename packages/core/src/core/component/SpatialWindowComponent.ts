import { SpatialComponent } from './SpatialComponent'
import { WebSpatial } from '../private/WebSpatial'
import { Vec3 } from '../SpatialTransform'
import { SpatialHelper } from '../SpatialHelper'

/**
 * Material type for SpatialDiv or HTML document.
 *
 * This type defines the background material options for both SpatialDiv elements and HTML documents.
 *
 * - `'none'`: This is the default value.
 *   - For HTML documents, the web page window will have the default native background.
 *   - For SpatialDiv, the window will have a transparent background.
 * - `'translucent'`: Represents a glass-like material in AVP (Apple Vision Pro).
 * - `'thick'`: Represents a thick material in AVP.
 * - `'regular'`: Represents a regular material in AVP.
 * - `'thin'`: Represents a thin material in AVP.
 * - `'transparent'`: Represents a fully transparent background.
 */
export type BackgroundMaterialType =
  | 'none'
  | 'translucent'
  | 'thick'
  | 'regular'
  | 'thin'
  | 'transparent'

export type CornerRadius = {
  topLeading: number
  bottomLeading: number
  topTrailing: number
  bottomTrailing: number
}

export type StyleParam = {
  material?: {
    type: BackgroundMaterialType
  }
  cornerRadius?: number | CornerRadius
}

/**
 * Used to position an web window in 3D space
 */
export class SpatialWindowComponent extends SpatialComponent {
  /**
   * Loads a url page in the window
   * @param url url to load
   */
  async loadURL(url: string) {
    await WebSpatial.updateResource(this._resource, { url: url })
  }

  async setFromWindow(window: any) {
    if (window._webSpatialID) {
      await WebSpatial.updateResource(this._resource, {
        windowID: window._webSpatialID,
      })
    } else {
      await console.warn(
        'failed to call setFromWindow, window provided is not valid',
      )
    }
  }

  /**
   * Sets the resolution of the window, the resulting dimensions when rendered will be equal to 1/1360 units
   * eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
   * See 1360 in spatialViewUI.swift for how this ratio works
   * @param width width in pixels
   * @param height height in pixels
   */
  async setResolution(width: number, height: number) {
    await WebSpatial.updateResource(this._resource, {
      resolution: { x: width, y: height },
    })
  }

  /**
   * [Experimental] Sets the anchor which the entity this is attached to will rotate around
   * @param rotationAnchor
   */
  async setRotationAnchor(rotationAnchor: Vec3) {
    await WebSpatial.updateResource(this._resource, {
      rotationAnchor: rotationAnchor,
    })
  }

  /**
   * [Experimental] Sets the opacity of the window after apply material
   * @param opacity
   */
  async setOpacity(opacity: number) {
    await WebSpatial.updateResource(this._resource, {
      opacity,
    })
  }

  /**
   * Sets the style that should be applied to the window
   * @param options style options
   */
  async setStyle(styleParam: StyleParam) {
    const currentWindowComponent =
      SpatialHelper.instance?.session.getCurrentWindowComponent()
    const isSettingSelfStyle =
      currentWindowComponent?._resource.id == this._resource.id

    const { material, cornerRadius } = styleParam
    const options: any = {}
    if (material?.type) {
      options.backgroundMaterial = material.type
    }

    if (cornerRadius !== undefined) {
      if (typeof cornerRadius === 'number') {
        options.cornerRadius = {
          topLeading: cornerRadius,
          bottomLeading: cornerRadius,
          topTrailing: cornerRadius,
          bottomTrailing: cornerRadius,
        }
      } else {
        options.cornerRadius = { ...cornerRadius }
      }
    }

    if (isSettingSelfStyle && document && document.readyState == 'loading') {
      // Avoid flash of unstyled content by sending style command via a link element
      var encoded = encodeURIComponent(JSON.stringify(options))

      const a = document.createElement(`a`)
      a.href = 'forcestyle://mystyle.css?' + 'style=' + encoded
      document.body.appendChild(a)
      a.click()
      // remove this element after trigger forceStyle action
      a.remove()
    } else {
      await WebSpatial.updateResource(this._resource, { style: options })
    }
  }

  /**
   * Modifies the amount the spatial window can be scrolled
   * Should only be used internally
   * See https://developer.apple.com/documentation/uikit/1624475-uiedgeinsetsmake?language=objc
   * @param insets margin to modify scroll distances by
   */
  async setScrollEdgeInsets(insets: {
    top: number
    left: number
    bottom: number
    right: number
  }) {
    await WebSpatial.updateResource(this._resource, {
      setScrollEdgeInsets: insets,
    })
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
    await WebSpatial.updateResource(this._resource, {
      scrollWithParent: scrollWithParent,
    })
  }
}
