declare global {
  interface Window {
    __webspatialsdk__?: {
      XR_ENV?: string
      'natvie-version'?: string
      'react-sdk-version'?: string
      'core-sdk-version'?: string
    }
  }
  declare const __coresdkversion__: string
}
export {}
