declare global {
  interface CSSStyleDeclaration {
    '--xr-background-material'?: string
    '--xr-back'?: number | string
    '--xr-z-index'?: number | string
  }
}

declare module 'react' {
  interface CSSProperties {
    '--xr-background-material'?: string
    '--xr-back'?: number | string
    '--xr-z-index'?: number | string
  }
}

declare global {
  interface CSSProperties {
    '--xr-background-material'?: string
    '--xr-z-index'?: number | string
  }
}

export namespace JSX {
  //   export type IntrinsicElements = {
  //     [K in keyof ReactJSXIntrinsicElements]: ReactJSXIntrinsicElements[K] & {
  //       style?: React.CSSProperties
  //       'enable-xr'?: boolean
  //     }
  //   }
}
