export type vecType = { x: number; y: number; z: number }
export type quatType = { x: number; y: number; z: number; w: number }
export type spatialStyleDef = {
  position: Partial<vecType>
  rotation: quatType
  scale: Partial<vecType>
  zIndex?: number
  transparentEffect: boolean
  glassEffect: boolean
  materialThickness: 'none' | 'thick' | 'regular' | 'thin'
  cornerRadius: number
}

export type RectType = {
  x: number
  y: number
  width: number
  height: number
}
