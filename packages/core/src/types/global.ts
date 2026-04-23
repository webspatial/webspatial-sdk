import type { PhysicalMetricsValueShape } from '../physicalMetrics'
import type { SpatialSceneCreationOptions, SpatialSceneType } from './types'

declare global {
  const __WEBSPATIAL_CORE_SDK_VERSION__: string

  interface Window {
    xrCurrentSceneType: SpatialSceneType
    xrCurrentSceneDefaults: (
      defaultConfig: SpatialSceneCreationOptions,
    ) => Promise<SpatialSceneCreationOptions>

    // Location for webspatial custom functions
    __WebSpatialData: {
      androidNativeMessage: Function
      getNativeVersion: Function
    }

    // Location for webspatial internal callbacks (eg. completion events)
    __SpatialWebEvent: Function

    // Used to access webkit specific api
    webkit: any
    webspatialBridge: any

    // Project Pico OS browser injects this global object to provide internal capabilities.
    webSpatial?: {
      genToken?: () => string
    }
    __webspatialShell__?: {
      genToken?: () => string
    }

    // Will be removed in favor of __WebSpatialData
    WebSpatailNativeVersion: string

    __webspatialsdk__?: {
      XR_ENV?: string
      'natvie-version'?: string
      'react-sdk-version'?: string
      'core-sdk-version'?: string
      physicalMetrics?: PhysicalMetricsValueShape
    }

    /** Present when `supports('xrInnerDepth')` is true; otherwise `undefined`. */
    xrInnerDepth?: number
    /** Present when `supports('xrOuterDepth')` is true; otherwise `undefined`. */
    xrOuterDepth?: number
  }

  interface HTMLElement {
    /** Present when `supports('xrOffsetBack')` is true for element readbacks. */
    xrOffsetBack?: number
    /** Present when `supports('xrClientDepth')` is true for element readbacks. */
    xrClientDepth?: number
  }
}

export {}
