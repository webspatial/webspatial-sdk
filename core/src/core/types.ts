export type WindowStyle = 'Plain' | 'Volumetric'

export interface WindowContainerOptions {
  defaultSize?: {
    width: number // Initial width of the window
    height: number // Initial height of the window
  }

  resizability?: 'automatic' | 'contentSize' | 'contentMinSize'
}

export type LoadingMethodKind = 'show' | 'hide'

export interface sceneDataShape {
  method?: 'createRoot' | 'showRoot'
  sceneConfig?: WindowContainerOptions
  url?: string
  window: Window
}

export interface sceneDataJSBShape {
  method?: 'createRoot' | 'showRoot'
  sceneConfig?: WindowContainerOptions
  url?: string
  windowID?: string
  windowContainerID?: string
}
