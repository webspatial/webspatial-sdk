declare global {
  interface Window {
    __webspatialsdk__?: {
      XR_ENV?: string
      'react-sdk-version'?: string
      'core-sdk-version'?: string
    }
  }
  interface ImportMeta {
    readonly XR_ENV: string
  }

  declare const __WEBSPATIAL_REACT_SDK_VERSION__: string
}

export {}
