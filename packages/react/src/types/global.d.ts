declare global {
  interface Window {
    __webspatialsdk__?: {
      'react-sdk-version'?: string
      'core-sdk-version'?: string
    }
  }

  declare const __WEBSPATIAL_REACT_SDK_VERSION__: string
}

export {}
