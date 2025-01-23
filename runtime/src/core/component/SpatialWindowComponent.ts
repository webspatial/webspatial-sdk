import { SpatialComponent } from './SpatialComponent'
import { Vec3, Vec4, WebSpatial } from '../private/WebSpatial'

export type BackgroundMaterialType =
  | 'none'
  | 'default'
  | 'thick'
  | 'regular'
  | 'thin'

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
  typeName = 'SpatialWebView'

  _preprocessState(state: any) {
    if (state.window) {
      state.windowID = state.window._webSpatialID
      delete state.window
    }
    return state
  }

  resolution?: { x: number; y: number }
  window?: Window

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
      await WebSpatial.logger.error(
        'failed to call setFromWindow, window provided is not valid',
      )
    }
  }

  /**
   * Sets the resolution of the window, the resulting dimensions when rendered will be equal to 1/1360 units
   * eg. if the resolution is set to 1360x1360 it will be a 1x1 plane
   * [TODO] should better document how this translates to dimensions when in app sapce, 1360 doesnt seem to be in any docs
   * @param x width in pixels
   * @param y height in pixels
   */
  async setResolution(x: number, y: number) {
    await WebSpatial.updateResource(this._resource, {
      resolution: { x: x, y: y },
    })
  }

  /**
   * [TODO] should this be on entity instead?
   * @param rotationAnchor
   */
  async setRotationAnchor(rotationAnchor: Vec3) {
    await WebSpatial.updateResource(this._resource, {
      rotationAnchor: rotationAnchor,
    })
  }

  /**
   * Sets the opacity of the window after apply material
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

    if (document && document.readyState == 'loading') {
      // Avoid flash of unstyled content by sending style command via a link element
      var encoded = encodeURIComponent(JSON.stringify(options))
      var x = document.createElement('link')
      x.rel = 'stylesheet'
      x.href = 'forceStyle://mystyle.css?' + 'style=' + encoded
      document.head.appendChild(x)
    }

    await WebSpatial.updateResource(this._resource, { style: options })
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
