type BackgroundMaterialType =
  | 'none'
  | 'translucent'
  | 'thick'
  | 'regular'
  | 'thin'
  | 'transparent'

type CornerRadius = {
  topLeading: number
  bottomLeading: number
  topTrailing: number
  bottomTrailing: number
}

type Vec2 = {
  x: number
  y: number
}

type Vec3 = {
  x: number
  y: number
  z: number
}

type Vec4 = {
  x: number
  y: number
  z: number
  w: number
}

type SpatialTransform = {
  position: Vec3
  orientation: Vec4
  scale: Vec3
}

// inspect return value

interface SpatialObjectData {
  id: string
  name: string
}

interface SpatialAppData {
  displayMode: string
  startUrl: string
  scope: string
}

interface SpatialSceneData extends SpatialObjectData {
  width: number
  height: number
  url: string
  windowStyle: 'Plain' | 'Volumetric'
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number

  backgroundMaterial: BackgroundMaterialType
  cornerRadius: CornerRadius

  spatialized2DElement: Array<Spatialized2DElementData>
  spatializedModel3DElement: Array<SpatializedModel3DElementData>
  spatializedDynamic3DElement: Array<SpatializedDynamic3DElementData>

  offset: Vec2
}

interface SpatializedElementData extends SpatialObjectData {
  width: number
  height: number
  transform: SpatialTransform
  rotationAnchor: Vec3
  opacity: number
  visible: boolean

  parent: string
}

interface SpatializedModel3DElementData extends SpatializedElementData {
  contentMode: 'fill' | 'fit'
  aspectRatio: number
  resizable: boolean
  modelURL: string
}

interface Spatialized2DElementData extends SpatializedElementData {
  children: Array<SpatializedElementData>
  window: WindowProxy
  backgroundMaterial: BackgroundMaterialType
  cornerRadius: CornerRadius

  scrollEnabled: boolean
  zIndex: number

  offset: Vec2
}

interface SpatialComponentData extends SpatialObjectData {
  entity: string
}

interface SpatialEntityData extends SpatialObjectData {
  children: Array<SpatialEntityData>
  parent: string
  components: Array<SpatialComponentData>

  transform: SpatialTransform
}

interface SpatializedDynamic3DElementData extends SpatializedElementData {
  children: Array<SpatialEntityData>
}
