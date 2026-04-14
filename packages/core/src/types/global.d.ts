import type { PhysicalMetricsValueShape } from '../physicalMetrics'

declare global {
  declare const __WEBSPATIAL_CORE_SDK_VERSION__: string

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

    xrInnerDepth: number
    xrOuterDepth: number
  }

  interface HTMLElement {
    xrOffsetBack: number
    xrClientDepth: number
  }
}

export {}
