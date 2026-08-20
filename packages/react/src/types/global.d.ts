import type React from 'react'
import type { ModelLoadEvent } from '../spatialized-container/types'

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
          onLoad?: (event: ModelLoadEvent) => void
          onError?: (event: ModelLoadEvent) => void
        },
        HTMLElement
      >
    }
  }
}

export {}
