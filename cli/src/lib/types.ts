export interface PWAInitArgs {
  'manifest-url'?: string // remote manifest url
  manifest?: string // local manifest path
  project?: string // local web project path
  base: string // url root
  'bundle-id'?: string // bundle id
}

export interface ManifestInfo {
  json: Record<string, any>
  url: string
  fromNet: boolean
}
