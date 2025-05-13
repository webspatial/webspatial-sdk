declare global {
  interface CSSStyleDeclaration {
    '--xr-background-material'?: string
    '--xr-back'?: number | string
    '--xr-z-index'?: number | string
    enableXr?: boolean
  }
}

export {}
