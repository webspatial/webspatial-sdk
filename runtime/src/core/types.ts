export type WindowStyle = 'Plain' | 'Volumetric'

export interface WindowGroupOptions {
  defaultSize?: {
    width: number // Initial width of the window
    height: number // Initial height of the window
  }

  resizability?: 'automatic' | 'contentSize' | 'contentMinSize'
}
