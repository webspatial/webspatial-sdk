import type React from 'react'

declare global {
  interface Window {
    __webspatialsdk__?: {
      'react-sdk-version'?: string
      'core-sdk-version'?: string
    }
  }

  declare const __WEBSPATIAL_REACT_SDK_VERSION__: string

  namespace JSX {
    interface IntrinsicElements {
      model: React.DetailedHTMLProps<
        Omit<React.HTMLAttributes<HTMLElement>, 'onLoad' | 'onError'> & {
          src?: string
          type?: string
          poster?: string
          autoplay?: boolean
          loop?: boolean
          onLoad?: (...args: any[]) => void
          onError?: (...args: any[]) => void
        },
        HTMLElement
      >
    }
  }
}

export {}
