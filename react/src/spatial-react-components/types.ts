import { BackgroundMaterialType, CornerRadius } from '@xrsdk/runtime'

export type vecType = { x: number; y: number; z: number }
export type quatType = { x: number; y: number; z: number; w: number }

export type spatialStyleDef = {
  position: Partial<vecType>
  rotation: quatType
  scale: Partial<vecType>
  zIndex?: number
  material?: { type: BackgroundMaterialType }
  cornerRadius: number | CornerRadius
}

export type RectType = {
  x: number
  y: number
  width: number
  height: number
}
