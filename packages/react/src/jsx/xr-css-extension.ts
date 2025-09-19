declare global {
  interface CSSStyleDeclaration {
    '--xr-background-material'?: string
    '--xr-back'?: number | string
    '--xr-depth'?: number | string
    '--xr-z-index'?: number | string
    enableXr?: boolean
  }
}

export {}
