declare global {
  interface Window {
    __webspatialsdk__?: {
      XR_ENV?: string
      'natvie-version'?: string
      'react-sdk-version'?: string
      'core-sdk-version'?: string
    }
  }
  declare const __WEBSPATIAL_CORE_SDK_VERSION__: string
}
export {}
